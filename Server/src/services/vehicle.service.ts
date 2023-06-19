import { logger } from "../utils/logger"
import database from "./database.service"
import { Vehicle, VehicleType, Track, Tracker } from ".prisma/client"
import TrackService from "./track.service"

import along from "@turf/along"
import bearing from "@turf/bearing"
import distance from "@turf/distance"
import * as turfHelpers from "@turf/helpers"
import * as turfMeta from "@turf/meta"
import TrackerService from "./tracker.service"

/** Service for vehicle management. */
export default class VehicleService{

    /**
     * Create a new vehicle
     * @param type `VehicleType` of new vehicle
     * @param name optional name for new vehicle
     * @returns created `Vehicle` if successful, `null` otherwise
     */
    public static async createVehicle(type: VehicleType, tracker?: Tracker, name?: string): Promise<Vehicle | null>{
        // TODO: make tracker assignment optional (in controller), replace empty string with undefined
        return database.vehicles.save(type.uid, tracker == null ? "" : tracker.uid, name == null ? undefined : name.trim())
    }

    /**
     * Search vehicle by id
     * @param id id to search vehicle for
     * @returns `Vehicle` with id `id` if it exists, `null` otherwise
     */
    public static async getVehicleById(id: number): Promise<Vehicle | null>{
        return database.vehicles.getById(id)
    }

    /**
     * Search for nearby vehicles either within a certain distance or by amount and either from a given point or vehicle
     * @param point point to search nearby vehicles from, this could also be a vehicle
     * @param count amount of vehicles, that should be returned. If none given only one (i.e. the nearest) will be returned.
     * @param heading could be either 1 or -1 to search for vehicles only towards the end and start of the track (seen from `point`) respectively
     * @param maxDistance maximum distance in track-kilometers to the vehicles
     * @param type `VehicleType` to filter the returned vehicles by
     * @returns `Vehicle[]` either #`count` of nearest vehicles or all vehicles within `distance` of track-kilometers, but at most #`count`.
     * That is the array could be empty. `null` if an error occurs
     */
    public static async getNearbyVehicles(point: GeoJSON.Feature<GeoJSON.Point> | Vehicle, count?: number, heading?: number, maxDistance?: number, type?: VehicleType): Promise<Vehicle[] | null>{
        // TODO: testing
        // extract vehicle position if a vehicle is given instead of a point
        if ((<Vehicle> point).uid) {
            const vehiclePosition = await this.getVehiclePosition((<Vehicle> point))
            if (vehiclePosition == null) {
                return null
            }
            point = vehiclePosition
        }

        // now we can safely assume, that this is actually a point
        const searchPoint = <GeoJSON.Feature<GeoJSON.Point>> point
        const nearestTrackPointsAndTrack = await TrackService.getNearestTrackPoints(searchPoint)
        if (nearestTrackPointsAndTrack == null) {
            return []
        }

        // compute distance of point mapped on track (pretty equal to parts of getVehicleTrackPosition, but can not be used, because we handle a point here)
        let trackDistance = -1
        // found one closest point
        if (nearestTrackPointsAndTrack[0].features.length == 1 && nearestTrackPointsAndTrack[0].features[0].properties != null && nearestTrackPointsAndTrack[0].features[0].properties["trackKm"] != null) {
            trackDistance = nearestTrackPointsAndTrack[0].features[0].properties["trackKm"]
        }
        if (nearestTrackPointsAndTrack[0].features.length != 2) {
            // TODO: log this, it should not happen at this point
            return null
        }
        const track = nearestTrackPointsAndTrack[1]
        const trackPoint0 = nearestTrackPointsAndTrack[0].features[0]
        const trackPoint1 = nearestTrackPointsAndTrack[0].features[1]

        // "normal" case with two closest points
        if (trackDistance < 0) {
            // interpolate distance
            const totalDistance = distance(trackPoint0, searchPoint) + distance(trackPoint1, searchPoint)
            if (trackPoint0.properties == null || trackPoint0.properties["trackKm"] == null) {
                // TODO: log this
                return null
            }
            trackDistance = trackPoint0.properties["trackKm"] + (distance(trackPoint0, searchPoint) / totalDistance) * distance(trackPoint0, trackPoint1)
        }

        // search for all vehicles on the track
        const allVehiclesOnTrack = await this.getAllVehiclesForTrack(track, type)

        // filter vehicles by heading
        if (heading != null) {

            // invalid heading
            if (heading != 1 && heading != -1) {
                // TODO: log this
                return null
            }

            allVehiclesOnTrack.filter(async function (vehicle, index, vehicles){
                const vehicleTrackKm = await VehicleService.getVehicleTrackDistanceKm(vehicle, track)
                if (vehicleTrackKm == null) {
                    // TODO: log this
                    return null
                    
                }
                return vehicleTrackKm - trackDistance * heading > 0
            })
        }

        // filter vehicles by distance if given
        if (maxDistance != null) {
            allVehiclesOnTrack.filter(async function (vehicle, index, vehicles){
                const vehicleTrackPosition = await VehicleService.getVehicleTrackPosition(vehicle, track)
                if (vehicleTrackPosition == null || vehicleTrackPosition.properties == null || vehicleTrackPosition.properties["trackKm"] == null) {
                    return false
                }
                return Math.abs(vehicleTrackPosition.properties["trackKm"] - trackDistance) < maxDistance
            })
        }

        // check if a certain amount is searched for
        count = count == null ? 1 : count

        // add the first #count vehicles by distance to result, also stop if all found vehicles are added
        let resultVehicles: Vehicle[] = []
        while (count > 0 || allVehiclesOnTrack.length == 0) {
            count--
            let minVehicle = null
            let minVehicleDistance = Number.POSITIVE_INFINITY
            for (let i = 0; i < allVehiclesOnTrack.length; i++) {
                const vehicleTrackKm = await this.getVehicleTrackDistanceKm(allVehiclesOnTrack[i], track);
                if (vehicleTrackKm == null) {
                    // TODO: log this, this should not happen
                    return null
                }

                // check if new minimal distance was found
                let distanceToVehicle = Math.abs(vehicleTrackKm - trackDistance)
                if (distanceToVehicle < minVehicleDistance) {
                    minVehicleDistance = distanceToVehicle
                    minVehicle = allVehiclesOnTrack[i]
                }
            }

            if (minVehicle == null) {
                // TODO: log this, this should not happen
                return null                
            }

            allVehiclesOnTrack.splice(allVehiclesOnTrack.indexOf(minVehicle), 1)
            resultVehicles.push(minVehicle)
        }

        return resultVehicles
    }

    /**
     * Search for vehicles on a track
     * @param track `Track` to search on for vehicles
     * @param type `VehicleType` to filter the returned vehicles by
     * @returns `Vehicle[]` of all vehicles on the given `track`
     */
    public static async getAllVehiclesForTrack(track: Track, type?: VehicleType): Promise<Vehicle[]>{

        // get all vehicles and filter first by type and then by track
        let vehicles: Vehicle[] = await database.vehicles.getAll()
        vehicles.filter(async function (vehicle, index, vehicles){
            const currentTrack = await VehicleService.getCurrentTrackForVehicle(vehicle)
            if (currentTrack == null) {
                return false
            }

            if (type != null && vehicle.typeId != type.uid) {
                return false
            }
            return track.uid == currentTrack.uid
        })
        return vehicles
    }
    
    /**
     * This is just a wrapper that gets the position of the tracker assigned to a given vehicle. Also it accumulates all
     * tracker data as a vehicle could have more than one tracker assigned.
     * @param vehicle `Vehicle` to get the position for
     * @returns last known position of `vehicle` based on tracker data (besides the GeoJSON point there is also the track 
     *          kilometer in the returned GeoJSON properties field), `null` if position is unknown
     */
    public static async getVehiclePosition(vehicle: Vehicle): Promise<GeoJSON.Feature<GeoJSON.Point> | null>{
        const position = await database.vehicles.getCurrentPosition(vehicle.uid)
        if (position == null) {
            return null
        }
        // TODO: what JSON do we get? This will maybe not work
        return JSON.parse(JSON.stringify(position))
    }

    /**
     * Get current track for a vehicle based on its last known position
     * @param vehicle `Vehicle` to get current track for
     * @returns current `Track` of `vehicle`
     */
    public static async getCurrentTrackForVehicle(vehicle: Vehicle): Promise<Track | null>{
        // nothing special, just get vehicle position and use Track-Service to get current track
        const vehiclePosition = await this.getVehiclePosition(vehicle)
        if (vehiclePosition == null) {
            return null
        }
        const nearestTrackPointsAndTrack = await TrackService.getNearestTrackPoints(vehiclePosition)
        if (nearestTrackPointsAndTrack == null) {
            return null
        }
        return nearestTrackPointsAndTrack[1]

    }

    /**
     * Compute track position of a given vehicle
     * @param vehicle `Vehicle` to compute position for
     * @param track optional `Track` to find position on, if none is given the closest track,
     * i.e. the track the vehicle is currently on, will be used (recommended)
     * @returns a point guaranteed to be on the track with a value `trackKm` in its properties, which represents the distance from 
     * the start of the track to the vehicle in track kilometers. `null` if an error occurs
     */
    public static async getVehicleTrackPosition(vehicle: Vehicle, track?: Track): Promise<GeoJSON.Feature<GeoJSON.Point> | null>{
        // TODO: testing
        // instead of using our own data model, it should be possible to use @turf/nearest-point-on-line
        // get vehicle position and nearest track points
        const vehiclePosition = await this.getVehiclePosition(vehicle)
        if (vehiclePosition == null) {
            return null
        }
        const nearestTrackPointsAndTrack = await TrackService.getNearestTrackPoints(vehiclePosition, track)
        if (nearestTrackPointsAndTrack == null) {
            return null
        }

        // wrap the results in variables and check if only one track point was found (then return it)
        if (nearestTrackPointsAndTrack[0].features.length == 1) {
            return nearestTrackPointsAndTrack[0].features[0]
        }
        if (nearestTrackPointsAndTrack[0].features.length != 2) {
            // TODO: log this, it should not happen at this point
            return null
        }
        track = nearestTrackPointsAndTrack[1]
        const trackPoint0 = nearestTrackPointsAndTrack[0].features[0]
        const trackPoint1 = nearestTrackPointsAndTrack[0].features[1]

        // interpolate distance
        const totalDistance = distance(trackPoint0, vehiclePosition) + distance(trackPoint1, vehiclePosition)
        if (trackPoint0.properties == null || trackPoint0.properties["trackKm"] == null) {
            // TODO: log this
            return null
        }
        const vehicleTrackDistance = trackPoint0.properties["trackKm"] + (distance(trackPoint0, vehiclePosition) / totalDistance) * distance(trackPoint0, trackPoint1)

        // create GeoJSON point
        const trackData: GeoJSON.FeatureCollection<GeoJSON.Point> = JSON.parse(JSON.stringify(track.data))
        const vehicleTrackPoint = along(turfHelpers.lineString(turfMeta.coordAll(trackData)), vehicleTrackDistance)
        vehicleTrackPoint.properties = {trackKm: vehicleTrackDistance}
        return vehicleTrackPoint
    }

    /**
     * Just a wrapper for getting track position of a vehicle to get its distance along the track.
     * @param vehicle `Vehicle` to get the distance for
     * @param track optional `Track` to map `vehicle` on, if none is given the current track of the
     * vehicle will be used (recommended)
     * @returns distance of `vehicle` as kilometers along the track, `null` if not possible
     */
    public static async getVehicleTrackDistanceKm(vehicle: Vehicle, track?: Track): Promise<number | null>{

        // get track point of vehicle
        const vehicleTrackPoint = await this.getVehicleTrackPosition(vehicle, track)
        if (vehicleTrackPoint == null) {
            return null
        }
        // TODO: log this, unexpected behaviour
        if (vehicleTrackPoint.properties == null || vehicleTrackPoint.properties["trackKm"] == null) {
            return null
        }

        // return track kilometer value in properties of vehicle track point
        return vehicleTrackPoint.properties["trackKm"]
    }

    /**
     * Get distance for vehicle along the track as percentage.
     * @param vehicle `Vehicle` to get the distance for
     * @param track optional `Track` to map `vehicle` on, if none is given the current track of the
     * vehicle will be used (recommended)
     * @returns distance of `vehicle` as percentage along the track, `null` if not possible
     */
    public static async getVehicleTrackDistancePercentage(vehicle: Vehicle, track?: Track): Promise<number | null>{

        // get current track if none is given
        if (track == null) {
            const curTrack = await this.getCurrentTrackForVehicle(vehicle)
            if (curTrack == null) {
                return null
            }
            track = curTrack
        }

        // get distance of vehicle and length of track and check for success
        const trackLength = await TrackService.getTrackLength(track)
        const vehicleDistance = await this.getVehicleTrackDistanceKm(vehicle, track)
        if (trackLength == null || vehicleDistance == null) {
            return null
        }

        // return percentage
        return vehicleDistance / trackLength * 100
    }

    /**
     * This is just a wrapper that gets the heading of the tracker assigned to a given vehicle. Also it accumulates all
     * tracker data as a vehicle could have more than one tracker assigned.
     * @param vehicle `Vehicle` to get the heading for
     * @returns last known heading (between 0 and 359) of `vehicle` based on tracker data, -1 if heading is unknown
     */
    public static async getVehicleHeading(vehicle: Vehicle): Promise<number>{
        const tracker = await TrackerService.getTrackerByVehicle(vehicle)
        if (tracker == null) {
            return -1
        }
        // TODO: there could be a database wrapper for this
        const logs = await database.logs.getAll(tracker.uid)
        if (logs.length == 0) {
            return -1
        }
        return logs[0].heading
    }

    /**
     * Determine heading of a vehicle related to a track (either "forward" or "backward")
     * @param vehicle `Vehicle` to get the heading from
     * @param track optional `Track`, which the heading should relate on, if none is given, the closest track,
     * i.e. the track the vehicle is on, will be used (recommended)
     * @returns 1 or -1 if the vehicle is heading towards the end and start of the track respectively, 0 if heading is unknown
     */
    public static async getVehicleTrackHeading(vehicle: Vehicle, track?: Track): Promise<number>{
        // TODO: this should be tested eventually
        // get (normal) heading and position of vehicle
        const vehicleHeading = await this.getVehicleHeading(vehicle)
        const vehiclePosition = await this.getVehiclePosition(vehicle)
        if (vehicleHeading == null || vehiclePosition == null) {
            return 0
        }

        // get closest track points
        const nearestTrackPointsAndTrack = await TrackService.getNearestTrackPoints(vehiclePosition, track)
        if (nearestTrackPointsAndTrack == null) {
            return 0
        }
        const nearestTrackPoints = nearestTrackPointsAndTrack[0]
        track = nearestTrackPointsAndTrack[1] // this should stay the same, if track was given
        const trackData: GeoJSON.FeatureCollection<GeoJSON.Point> = JSON.parse(JSON.stringify(track.data))

        // check if only one closest point was found and add another appropriate one
        if (nearestTrackPoints.features.length == 1) {
            // append the previous point (or next point in case we only have the very first track point)
            // (we can search for those features, because an id was assigned)
            const trackPointIndex = trackData.features.indexOf(nearestTrackPoints.features[0])
            if (trackPointIndex == 0){
                nearestTrackPoints.features.push(trackData.features[1])
            } else {
                nearestTrackPoints.features.push(trackData.features[trackPointIndex - 1])
            }
        }

        if (nearestTrackPoints.features.length != 2) {
            // TODO: log this, this should not happen at this point
            return 0
        }

        // sort track points according to their track kilometer value
        let trackPoint0 = nearestTrackPoints.features[0]
        let trackPoint1 = nearestTrackPoints.features[1]
        if (trackPoint0.properties != null && trackPoint1.properties != null 
            && trackPoint0.properties["trackKm"] > trackPoint1.properties["trackKm"]) {
            [trackPoint0, trackPoint1] = [trackPoint1, trackPoint0]
        }

        // get bearing of track segment (and fir it for our format 0-359)
        const trackBearing = bearing(trackPoint0, trackPoint1) + 180
        // finally compute track heading (with a little buffer of uncertainty)
        if (vehicleHeading - trackBearing < 85 || vehicleHeading - trackBearing > -85) {
            return 1
        } else {
            return -1
        }
    }

    /**
     * This is just a wrapper that gets the speed of the tracker assigned to a given vehicle. Also it accumulates all
     * tracker data as a vehicle could have more than one tracker assigned.
     * @param vehicle `Vehicle` to get the speed for
     * @returns last known speed (always a positive number) of `vehicle` based on tracker data, -1 if speed is unknown
     */
    public static async getVehicleSpeed(vehicle: Vehicle): Promise<number>{
        const tracker = await TrackerService.getTrackerByVehicle(vehicle)
        if (tracker == null) {
            return -1
        }
        // TODO: there could be a database wrapper for this
        const logs = await database.logs.getAll(tracker.uid)
        if (logs.length == 0) {
            return -1
        }
        return logs[0].speed
    }

    /**
     * Rename an existing vehicle
     * @param vehicle `Vehicle` to rename
     * @param newName new name for `vehicle`
     * @returns renamed `Vehicle` if successful, `null` otherwise
     */
    public static async renameVehicle(vehicle: Vehicle, newName: string): Promise<Vehicle | null>{
        return database.vehicles.update(vehicle.uid, undefined, undefined, newName)
    }

    /**
     * Update type of vehicle
     * @param vehicle `Vehicle` to set new type for
     * @param type new `VehicleType` of `vehicle`
     * @returns updated `Vehicle` if successful, `null` otherwise
     */
    public static async setVehicleType(vehicle: Vehicle, type: VehicleType): Promise<Vehicle | null>{
        return database.vehicles.update(vehicle.uid, type.uid)
    }

    /**
     * Assign a new tracker to a given vehicle
     * @param vehicle `Vehicle` to assign `tracker` to
     * @param tracker `Tracker` to be assigne to `vehicle`
     * @returns updated `Vehicle` with assigned `tracker` if successful, `null` otherwise
     */
    public static async assignTrackerToVehicle(vehicle: Vehicle, tracker: Tracker): Promise<Vehicle | null>{
        return database.vehicles.update(vehicle.uid, undefined, tracker.uid)
    }

    /**
     * Delete existing vehicle
     * @param vehicle `Vehicle` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removeVehicle(vehicle: Vehicle): Promise<boolean>{
        return database.vehicles.remove(vehicle.uid)
    }



    // --- vehicle types ---

    /**
     * Create a new vehicle type
     * @param type description of new vehicle type
     * @returns created `VehicleType` if successful, `null` otherwise
     */
    public static async createVehicleType(type: string, ): Promise<VehicleType | null>{
        return database.vehicles.saveType(type) // TODO: description?!
    }

    /**
     * 
     * @returns all existing `VehicleType`s
     */
    public static async getAllVehicleTypes(): Promise<VehicleType[]>{
        return database.vehicles.getAllTypes()
    }

    /**
     * Change description of existing vehicle type
     * @param type `VehicleType` to change description of
     * @param newType new description for `type`
     * @returns updated `VehicleType` if successful, `null` otherwise
     */
    public static async renameVehicleType(type: VehicleType, newType: string): Promise<VehicleType | null>{
        return database.vehicles.updateType(type.uid, newType)
    }

    /**
     * Delete existing vehicle type
     * @param type `VehicleType` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removeVehicleType(type: VehicleType): Promise<boolean>{
        return database.vehicles.remove(type.uid)
    }
}