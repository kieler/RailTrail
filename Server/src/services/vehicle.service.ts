import { logger } from "../utils/logger"
import database from "./database.service"
import { Vehicle, VehicleType, Track, Tracker } from ".prisma/client"
import TrackService from "./track.service"
import TrackerService from "./tracker.service"
import GeoJSONUtils from "../utils/geojsonUtils"

import along from "@turf/along"
import bearing from "@turf/bearing"
import distance from "@turf/distance"
import * as turfHelpers from "@turf/helpers"
import * as turfMeta from "@turf/meta"
import { Position } from "../models/api"
import { Log } from "@prisma/client"

/** Service for vehicle management. */
export default class VehicleService {
	public static async appendLog(
		vehicleId: number,
		position: Position,
		heading: number,
		speed: number
	): Promise<Log | null> {
		return await database.logs.save(
			new Date(),
			vehicleId,
			[position.lng, position.lat],
			heading,
			speed,
			undefined,
			undefined,
			undefined
		)
	}

	/**
	 * Create a new vehicle
	 * @param type `VehicleType` of new vehicle
	 * @param name name for new vehicle (has to be unique for the track)
	 * @param track_uid `Track`
	 * @returns created `Vehicle` if successful, `null` otherwise
	 */
	public static async createVehicle(type: VehicleType, track_uid: number, name: string): Promise<Vehicle | null> {
		return database.vehicles.save(type.uid, track_uid, name)
	}

	/**
	 * Search vehicle by id
	 * @param id id to search vehicle for
	 * @returns `Vehicle` with id `id` if it exists, `null` otherwise
	 */
	public static async getVehicleById(id: number): Promise<Vehicle | null> {
		return database.vehicles.getById(id)
	}

	/**
	 * Search vehicle by name (this function should not be used mainly to identify a vehicle, but rather to get the vehicle id)
	 * @param name name to search the vehicle by (which should be unique on the given track)
	 * @param track `Track` the vehicle is assigned to
	 * @returns `Vehicle` with name `name` if it exists, `null` otherwise
	 */
	public static async getVehicleByName(name: string, track: Track): Promise<Vehicle | null> {
		return database.vehicles.getByName(name, track.uid)
	}

	/**
	 * Search for nearby vehicles either within a certain distance or by amount and either from a given point or vehicle
	 * @param point point to search nearby vehicles from, this could also be a vehicle
	 * @param track `Track` to search on for vehicles. If none is given, the closest will be used.
     * @paramcount amount of vehicles, that should be returned. If none given, all will be returned.
	 * @param heading could be either 1 or -1 to search for vehicles only towards the end and start of the track (seen from `point`) respectively
	 * @param maxDistance maximum distance in track-kilometers to the vehicles
	 * @param type `VehicleType` to filter the returned vehicles by
	 * @returns `Vehicle[]` either #`count` of nearest vehicles or all vehicles within `distance` of track-kilometers, but at most #`count`.
	 * That is the array could be empty. `null` if an error occurs
	 */
	public static async getNearbyVehicles(
		point: GeoJSON.Feature<GeoJSON.Point> | Vehicle,
		track?: Track,count?: number,
		heading?: number,
		maxDistance?: number,
		type?: VehicleType
	): Promise<Vehicle[] | null> {
		// TODO: testing
		// extract vehicle position if a vehicle is given instead of a point
		if ((<Vehicle>point).uid) {
			const vehiclePosition = await this.getVehiclePosition(<Vehicle>point)
			if (vehiclePosition == null) {
				return null
			}
			point = vehiclePosition
		}

		// now we can safely assume, that this is actually a point
		const searchPoint = <GeoJSON.Feature<GeoJSON.Point>>point
		// check if a track is given, else initialize it with the closest one
		if (track == null) {
			const tempTrack = await TrackService.getClosestTrack(searchPoint)
			if (tempTrack == null) {

			// TODO: log this
			return null
		}
		 track = tempTrack
		}

		// compute distance of point mapped on track
			const trackDistance = await TrackService.getPointTrackKm(searchPoint, track)
			if (trackDistance == null) {
				// TODO: log this
				return null
			}


		// search for all vehicles on the track
		let allVehiclesOnTrack = await this.getAllVehiclesForTrack(track, type)

		// filter vehicles by heading
		if (heading != null) {
			// invalid heading
			if (heading != 1 && heading != -1) {
				// TODO: log this
				return null
			}

			allVehiclesOnTrack.filter(async function (vehicle, _index, _vehicles) {
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
			allVehiclesOnTrack.filter(async function (vehicle, _index, _vehicles) {
				const vehicleTrackKm = await VehicleService.getVehicleTrackDistanceKm(vehicle, track)
				if (vehicleTrackKm == null) {
					return false
				}
				return Math.abs(vehicleTrackKm - trackDistance) < maxDistance
			})
		}

		// enrich vehicles with track distance for sorting
		let vehiclesWithDistances: [Vehicle, number][] = await Promise.all(
			allVehiclesOnTrack.map(async function (vehicle) {
				let vehicleDistance = await VehicleService.getVehicleTrackDistanceKm(vehicle)
				vehicleDistance = vehicleDistance == null ? -1 : vehicleDistance // this should not happen
				return [vehicle, vehicleDistance]
			})
		)

		// sort vehicles by distance to searched point
		vehiclesWithDistances = vehiclesWithDistances.sort(function (v0, v1) {
			// if this happens, we cannot sort the POI's
			if (v0[1] < 0 || v1[1] < 0) {
				// TODO: log this, maybe some other handling
				return 0
			}

			// compute distances to current vehicle and compare
			const distanceToVehicle0 = Math.abs(v0[1] - trackDistance)
			const distanceToVehicle1 = Math.abs(v1[1] - trackDistance)
			return distanceToVehicle0 - distanceToVehicle1
		})

		// map vehicles back to array without distances
		allVehiclesOnTrack = vehiclesWithDistances.map(v => v[0])

		// check if a certain amount is searched for
		count = count == null ? allVehiclesOnTrack.length : count

		// if less POI's were found then we need to return, we return every POI that we have
		if (count > allVehiclesOnTrack.length) {
			return allVehiclesOnTrack
		}

		// only return first #count of POI's
		allVehiclesOnTrack.slice(0, count)
		return allVehiclesOnTrack
	}

	/**
	 * Search for vehicles on a track
	 * @param track `Track` to search on for vehicles
	 * @param type `VehicleType` to filter the returned vehicles by
	 * @returns `Vehicle[]` of all vehicles on the given `track`
	 */
	public static async getAllVehiclesForTrack(track: Track, type?: VehicleType): Promise<Vehicle[]> {
		// get all vehicles and filter first by type and then by track
		const vehicles: Vehicle[] = await database.vehicles.getAll()
		vehicles.filter(async function (vehicle, _index, _vehicles) {
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
	public static async getVehiclePosition(vehicle: Vehicle): Promise<GeoJSON.Feature<GeoJSON.Point> | null> {
		// TODO: implement real position computation, this is just a stub returning the last known position,
		// which is pointless if the current position of the requesting app is saved right before

        const positions = await database.logs.getAll(vehicle.uid)
        if (positions.length < 1) {
            return null
        }
        const positionGeoJSON = GeoJSONUtils.parseGeoJSONFeaturePoint(positions[0].position)
        if (positionGeoJSON == null) {
            return null
        }
        return positionGeoJSON
    }

    /**
     * Get current track for a vehicle based on its last known position
     * @param position GeoJSON position to get current track for, could also be a `Vehicle`
     * @returns current `Track` of `vehicle`
     */
    public static async getCurrentTrackForVehicle(position: GeoJSON.Feature<GeoJSON.Point> | Vehicle): Promise<Track | null>{
        // TODO: this is probably outdated as the new database model has a track associated to a vehicle,
        // but could be useful, e.g. for comparing assigned and closest track


		// unwrap vehicle position if vehicle is given
		if ((<Vehicle>position).uid) {
			const vehiclePosition = await this.getVehiclePosition(<Vehicle>position)
			if (vehiclePosition == null) {
				return null
			}
			position = vehiclePosition
		}

		return TrackService.getClosestTrack(position as GeoJSON.Feature<GeoJSON.Point>)
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
        // TODO: maybe not needed with the new position computation (to be implemented)

        // get vehicle position and map it onto the track
        const vehiclePosition = await this.getVehiclePosition(vehicle)
        if (vehiclePosition == null) {
            return null
        }
        return TrackService.getProjectedPointOnTrack(vehiclePosition, track)
    }

	/**
	 * Just a wrapper for getting track position of a vehicle to get its distance along the track.
	 * @param vehicle `Vehicle` to get the distance for
	 * @param track optional `Track` to map `vehicle` on, if none is given the current track of the
	 * vehicle will be used (recommended)
	 * @returns distance of `vehicle` as kilometers along the track, `null` if not possible
	 */
	public static async getVehicleTrackDistanceKm(vehicle: Vehicle, track?: Track): Promise<number | null> {
		// get track point of vehicle
		const vehicleTrackPoint = await this.getVehicleTrackPosition(vehicle, track)
		if (vehicleTrackPoint == null) {
			// TODO: log this
			return null
		}

		// get track kilometer for vehicle position
		const vehicleTrackKm = GeoJSONUtils.getTrackKm(vehicleTrackPoint)
		if (vehicleTrackKm == null) {
			// TODO: log this
			return null
		}

		return vehicleTrackKm
	}

	/**
	 * Get distance for vehicle along the track as percentage.
	 * @param vehicle `Vehicle` to get the distance for
	 * @param track optional `Track` to map `vehicle` on, if none is given the current track of the
	 * vehicle will be used (recommended)
	 * @returns distance of `vehicle` as percentage along the track, `null` if not possible
	 */
	public static async getVehicleTrackDistancePercentage(vehicle: Vehicle, track?: Track): Promise<number | null> {
		// get current track if none is given
		if (track == null) {
			const curTrack = await this.getCurrentTrackForVehicle(vehicle)
			if (curTrack == null) {
				return null
			}
			track = curTrack
		}

		// get distance of vehicle and length of track and check for success
		const trackLength = TrackService.getTrackLength(track)
		const vehicleDistance = await this.getVehicleTrackDistanceKm(vehicle, track)
		if (trackLength == null || vehicleDistance == null) {
			return null
		}

		// return percentage
		return (vehicleDistance / trackLength) * 100
	}

	/**
	 * This is just a wrapper that gets the heading of the tracker assigned to a given vehicle. Also it accumulates all
	 * tracker data as a vehicle could have more than one tracker assigned.
	 * @param vehicle `Vehicle` to get the heading for
	 * @returns last known heading (between 0 and 359) of `vehicle` based on tracker data, -1 if heading is unknown
	 */
	public static async getVehicleHeading(vehicle: Vehicle): Promise<number> {
		// TODO: instead of just returning last heading a computation / validation could be better (e.g. for multiple trackers)

		// get last heading of logs
		const logs = await database.logs.getAll(vehicle.uid)
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
        // TODO: this should be tested

        // initialize track if none is given
        const vehiclePosition = await this.getVehiclePosition(vehicle)
        if (vehiclePosition == null) {
            // TODO: log this
            return 0
        }
        if (track == null) {
            const tempTrack = await TrackService.getClosestTrack(vehiclePosition)
            if (tempTrack == null) {
                // TODO: log this
                return 0
            }
            track = tempTrack
        }

        // get (normal) heading and position of vehicle
        const vehicleHeading = await this.getVehicleHeading(vehicle)
        const vehicleTrackKm = await this.getVehicleTrackDistanceKm(vehicle, track)
        if (vehicleHeading == null || vehicleTrackKm == null) {
            return 0
        }

        // finally compute track heading
        const trackBearing = await TrackService.getTrackHeading(track, vehicleTrackKm)
        if (trackBearing == null) {
            // TODO: log this
            return 0
        }
        // TODO: maybe give this a certain buffer of uncertainty
        if (vehicleHeading - trackBearing < 90 || vehicleHeading - trackBearing > -90) {
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
	public static async getVehicleSpeed(vehicle: Vehicle): Promise<number> {
		// TODO: instead of just returning last heading a computation / validation could be better (e.g. for multiple trackers)

		// get last heading of logs
		const logs = await database.logs.getAll(vehicle.uid)
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
	public static async renameVehicle(vehicle: Vehicle, newName: string): Promise<Vehicle | null> {
		return database.vehicles.update(vehicle.uid, undefined, undefined, newName)
	}

	/**
	 * Update type of vehicle
	 * @param vehicle `Vehicle` to set new type for
	 * @param type new `VehicleType` of `vehicle`
	 * @returns updated `Vehicle` if successful, `null` otherwise
	 */
	public static async setVehicleType(vehicle: Vehicle, type: VehicleType): Promise<Vehicle | null> {
		return database.vehicles.update(vehicle.uid, type.uid)
	}

	/**
	 * Assign a new tracker to a given vehicle (wrapper for TrackerService)
	 * @param vehicle `Vehicle` to assign `tracker` to
	 * @param tracker `Tracker` to be assigned to `vehicle`
	 * @returns updated `Tracker` with assigned `vehicle` if successful, `null` otherwise
	 */
	public static async assignTrackerToVehicle(tracker: Tracker, vehicle: Vehicle): Promise<Tracker | null> {
		return TrackerService.setVehicle(tracker, vehicle)
	}

	/**
	 * Delete existing vehicle
	 * @param vehicle `Vehicle` to delete
	 * @returns `true` if deletion was successful, `false` otherwise
	 */
	public static async removeVehicle(vehicle: Vehicle): Promise<boolean> {
		return database.vehicles.remove(vehicle.uid)
	}

	// --- vehicle types ---

	/**
	 * Create a new vehicle type
	 * @param type description of new vehicle type
	 * @param icon name of an icon associated to type
	 * @param desc (optional) description for new vehicle type
	 * @returns created `VehicleType` if successful, `null` otherwise
	 */
	public static async createVehicleType(type: string, icon: string, desc?: string): Promise<VehicleType | null> {
		return database.vehicles.saveType(type, icon, desc)
	}

	/**
	 *
	 * @returns all existing `VehicleType`s
	 */
	public static async getAllVehicleTypes(): Promise<VehicleType[]> {
		return database.vehicles.getAllTypes()
	}

	/**
	 * Search vehicle type by a given id
	 * @param id id to search vehicle type for
	 * @returns `VehicleType` with id `id`, null if not successful
	 */
	public static async getVehicleTypeById(id: number): Promise<VehicleType | null> {
		return database.vehicles.getTypeById(id)
	}

	/**
	 * Change name of existing vehicle type
	 * @param type `VehicleType` to change name of
	 * @param newType new name for `type`
	 * @returns updated `VehicleType` if successful, `null` otherwise
	 */
	public static async renameVehicleType(type: VehicleType, newType: string): Promise<VehicleType | null> {
		return database.vehicles.updateType(type.uid, newType)
	}

	/**
	 * Change description of vehicle type
	 * @param type `VehicleType` to change the description of
	 * @param desc new description for `type`
	 * @returns updated `VehicleType` if successful, `null` otherwise
	 */
	public static async setVehicleTypeDescription(type: VehicleType, desc: string): Promise<VehicleType | null> {
		return database.vehicles.updateType(type.uid, undefined, undefined, desc)
	}

	/**
	 * Change icon of vehicle type
	 * @param type `VehicleType` to change the icon of
	 * @param icon name of new icon to be associated with type
	 * @returns updated `VehicleType` if successful, `null` otherwise
	 */
	public static async setVehicleTypeIcon(type: VehicleType, icon: string): Promise<VehicleType | null> {
		return database.vehicles.updateType(type.uid, undefined, icon)
	}

	/**
	 * Delete existing vehicle type
	 * @param type `VehicleType` to delete
	 * @returns `true` if deletion was successful, `false` otherwise
	 */
	public static async removeVehicleType(type: VehicleType): Promise<boolean> {
		return database.vehicles.remove(type.uid)
	}

	static async getAllVehicles() {
		const vehicles: Vehicle[] = await database.vehicles.getAll()

		return vehicles
	}
}
