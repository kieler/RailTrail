import { logger } from "../utils/logger"
import { POI, POIType, Track, Vehicle } from ".prisma/client"
import database from "./database.service"
import TrackService from "./track.service"
import distance from "@turf/distance"
import VehicleService from "./vehicle.service"

/**
 * Service for POI (point of interest) management.
 */
export default class POIService{

    /**
     * Create a new POI
     * @param position position of new POI, a value for the track kilometer when mapped on track will be added
     * @param name name of new POI 
     * @param type `POIType` of new POI
     * @param track `Track` the new POI belongs to, if no track is given, the closest will be chosen
     * @param description optional description of the new POI
     * @returns created `POI` if successful, `null` otherwise
     */
    public static async createPOI(position: GeoJSON.Feature<GeoJSON.Point>, name: string, type: POIType, track?: Track, description?: string): Promise<POI | null>{

        // get closest track if none is given
        if (track == null) {
            const pointsAndTrack = await TrackService.getNearestTrackPoints(position)
            if (pointsAndTrack == null) {
                return null
            }
            track = pointsAndTrack[1]
        }
        
        // add kilometer value
        const enrichedPoint = await this.enrichPOIPosition(position, track)
        if (enrichedPoint == null) {
            return null
        }
        return database.pois.save(name, type.uid, track.uid, JSON.parse(JSON.stringify(enrichedPoint)), description)
    }

    /**
     * Add value of track kilometer to properties for a given point
     * @param point position of POI to enrich
     * @param track optional `TracK`, which is used to compute the track kilometer, if none is given the closest will be used
     * @returns point with added track kilometer, `null` if not successful
     */
    private static async enrichPOIPosition(point: GeoJSON.Feature<GeoJSON.Point>, track?: Track): Promise<GeoJSON.Feature<GeoJSON.Point> | null>{
        
        // get closest track if none is given
        const pointsAndTrack = await TrackService.getNearestTrackPoints(point, track)
        if (pointsAndTrack == null) {
            return null
        }

        // compute track distance
        const nearestTrackPoints = pointsAndTrack[0]
        // initialize properties of point (do not throw away other properties)
        point.properties = point.properties == null ? {} : point.properties
        // check for only one closest point
        if (nearestTrackPoints.features.length == 1 && nearestTrackPoints.features[0].properties != null && nearestTrackPoints.features[0].properties["trackKm"] != null) {
            point.properties["trackKm"] = nearestTrackPoints.features[0].properties["trackKm"]
            return point
        }

        // TODO: this should not happen, log this
        if (nearestTrackPoints.features.length != 2) {
            return null
        }

        // case for two closest points
        if (nearestTrackPoints.features[0].properties == null || nearestTrackPoints.features[0].properties["trackKm"] == null 
            || nearestTrackPoints.features[1].properties == null || nearestTrackPoints.features[1].properties["trackKm"] == null) {
            // TODO: log this
            return null
        }
        const totalDistance = distance(nearestTrackPoints.features[0], point) + distance(point, nearestTrackPoints.features[1])
        point.properties["trackKm"] = nearestTrackPoints.features[0].properties["trackKm"] + 
                distance(nearestTrackPoints.features[0], point) / totalDistance * distance(nearestTrackPoints.features[0], nearestTrackPoints.features[1])

        return point
    }

    /**
     * 
     * @param id id of POI to search for
     * @returns `POI` with `id` if it exists, `null` otherwise
     */
    public static async getPOIById(id: number): Promise<POI | null>{
        return database.pois.getById(id)
    }

    /**
     * Search for nearby POI's either within a certain distance or by amount
     * @param point point to search nearby POI's from
     * @param count amount of points, that should be returned. If none given only one (i.e. the nearest) will be returned.
     * @param heading could be either 1 or -1 to search for POI only towards the end and start of the track (seen from `point`) respectively
     * @param maxDistance maximum distance in track-kilometers to the POI's
     * @param type `POIType` to filter the returned POI's by
     * @returns `POI[]`, either #`count` of nearest POI's or all POI's within `maxDistance` of track-kilometers, but at most #`count`.
     * That is the array could be empty.
     */
    public static async getNearbyPOIs(point: GeoJSON.Feature<GeoJSON.Point> | Vehicle, count?: number, heading?: number, maxDistance?: number, type?: POIType): Promise<POI[] | null>{
        // TODO: testing
        // TODO: just copied from VehicleService, i.e. there is probably a better solution
        // extract vehicle position if a vehicle is given instead of a point
        if ((<Vehicle> point).uid) {
            const vehiclePosition = await VehicleService.getVehiclePosition((<Vehicle> point))
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

        // search for all POIs on the track
        const allPOIsForTrack = await this.getAllPOIsForTrack(track, type)

        // filter pois by heading if given
        if (heading != null) {

            // invalid heading
            if (heading != 1 && heading != -1) {
                // TODO: log this
                return null
            }

            allPOIsForTrack.filter(function (poi, index, pois){
                const poiPosition: GeoJSON.Feature<GeoJSON.Point> = JSON.parse(JSON.stringify(poi.position))
                if (poiPosition.properties == null || poiPosition.properties["trackKm"] == null) {
                    return false
                }
                return poiPosition.properties["trackKm"] - trackDistance * heading > 0
            })
        }

        // filter pois by distance if given
        if (maxDistance != null) {
            allPOIsForTrack.filter(function (poi, index, pois){
                const poiPosition: GeoJSON.Feature<GeoJSON.Point> = JSON.parse(JSON.stringify(poi.position))
                if (poiPosition.properties == null || poiPosition.properties["trackKm"] == null) {
                    return false
                }
                // consider both directions (heading would filter those out)
                return Math.abs(poiPosition.properties["trackKm"] - trackDistance) < maxDistance
            })
        }

        // check if a certain amount is searched for
        count = count == null ? 1 : count

        // add the first #count POIs by distance to result, also stop if all found POIs are added
        // TODO: sorting is faster
        let resultPOIs: POI[] = []
        while (count > 0 || allPOIsForTrack.length == 0) {
            count--
            let minPOI = null
            let minPOIDistance = Number.POSITIVE_INFINITY
            for (let i = 0; i < allPOIsForTrack.length; i++) {
                const POIPosition: GeoJSON.Feature<GeoJSON.Point> = JSON.parse(JSON.stringify(allPOIsForTrack[i].position))
                if ( POIPosition == null || POIPosition.properties == null || POIPosition.properties["trackKm"] == null) {
                    // TODO: log this, this should not happen
                    return null
                }

                // check if new minimal distance was found
                let distanceToVehicle = Math.abs(POIPosition.properties["trackKm"] - trackDistance)
                if (distanceToVehicle < minPOIDistance) {
                    minPOIDistance = distanceToVehicle
                    minPOI = allPOIsForTrack[i]
                }
            }

            if (minPOI == null) {
                // TODO: log this, this should not happen
                return null                
            }

            allPOIsForTrack.splice(allPOIsForTrack.indexOf(minPOI), 1)
            resultPOIs.push(minPOI)
        }

        return resultPOIs
    }

    /**
     * Search for POI's on a track
     * @param track `Track` to search on for POI's
     * @param type `POIType` to filter the returned POI's by
     * @returns `POI[]` of all POI's along the given `track`
     */
    public static async getAllPOIsForTrack(track: Track, type?: POIType): Promise<POI[]>{

        // no type given, just return database query
        if (type == null) {
            return database.pois.getAll(track.uid)
        }

        // filter by type
        let trackPOIs = await database.pois.getAll(track.uid)
        trackPOIs.filter(function (poi, index, poiList){
            return poi.typeId == type.uid
        })
        return trackPOIs
    }

    /**
     * Set a new position for an existing POI
     * @param poi `POI` to update 
     * @param position new position of `poi`
     * @returns updated `POI` if successful, `null` otherwise
     */
    public static async setPOIPosition(poi: POI, position: GeoJSON.Feature<GeoJSON.Point>): Promise<POI | null>{
        
        // enrich and update
        const POITrack = await database.tracks.getById(poi.trackId)
        if (POITrack == null) {
            // TODO: this really should not happen, how to handle? delete POI?
            return null
        }
        const enrichedPoint = await this.enrichPOIPosition(position, POITrack)
        if (enrichedPoint == null) {
            return null
        }
        return database.pois.update(poi.uid, undefined, undefined, undefined, undefined, JSON.parse(JSON.stringify(enrichedPoint)))
    }

    /**
     * Rename an existing POI
     * @param poi `POI` to rename
     * @param newName new name of `poi`
     * @returns renamed `POI` if successful, `null` otherwise
     */
    public static async renamePOI(poi: POI, newName: string): Promise<POI | null>{
        return database.pois.update(poi.uid, newName)
    }

    /**
     * Update description for a given POI
     * @param poi `POI` to update description for
     * @param newDesc new description for `poi`
     * @returns updated `POI` if successful, `null` otherwise
     */
    public static async updateDescription(poi: POI, newDesc: string): Promise<POI | null>{
        return database.pois.update(poi.uid, undefined, newDesc)
    }

    /**
     * Set new type of POI
     * @param poi `POI` to update
     * @param type new type of `poi`
     * @returns updated `POI` if successful, `null` otherwise
     */
    public static async setPOIType(poi: POI, type: POIType): Promise<POI | null>{
        return database.pois.update(poi.uid, undefined, undefined, type.uid)
    }

    /**
     * Set track for POI
     * @param poi `POI` to set track for
     * @param track new `Track` for `poi`
     * @returns updated `POI` if successful, `null` otherwise
     */
    public static async setPOITrack(poi: POI, track: Track): Promise<POI | null>{

        // update track kilometer value first
        const updatedPOIPos = await this.enrichPOIPosition(JSON.parse(JSON.stringify(poi.position)))
        if (updatedPOIPos == null) {
            return null
        }

        // update poi's position and track
        return database.pois.update(poi.uid, undefined, undefined, undefined, track.uid, JSON.parse(JSON.stringify(updatedPOIPos)))
    }

    /**
     * Delete existing POI
     * @param poi `POI` to delete
     * @returns `true`, if deletion was successful, `false` otherwise
     */
    public static async removePOI(poi: POI): Promise<boolean>{
        return database.pois.remove(poi.uid)
    }



    // --- POI-types ---

    /**
     * Create new POI-type
     * @param type name of new POI-type
     * @param desc optional description of new POI-type
     * @returns created `POIType` if successful, `null` otherwise
     */
    public static async createPOIType(type: string, desc?: string): Promise<POIType | null>{
        return database.pois.saveType(type, desc)
    }

    /**
     * 
     * @returns all existing `POIType`s
     */
    public static async getAllPOITypes(): Promise<POIType[]>{
        return database.pois.getAllTypes()
    }

    /**
     * Change name of existing POI-type
     * @param type `POIType` to change name of
     * @param newType new name for `type`
     * @returns renamed `POIType` if successful, `null` otherwise
     */
    public static async renamePOIType(type: POIType, newType: string): Promise<POIType | null>{
        return database.pois.updateType(type.uid, newType)
    }

    /**
     * Update description of existing POI-type
     * @param type `POIType` to change description of
     * @param desc new description for `type`
     * @returns updated `POIType` if successful, `null` otherwise
     */
    public static async setPOITypeDescription(type: POIType, desc: string): Promise<POIType | null> {
        return database.pois.updateType(type.uid, undefined, desc)
    }

    /**
     * Delete existing POI-type
     * @param type `POIType` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removePOIType(type: POIType): Promise<boolean>{
        return database.pois.removeType(type.uid)
    }

}