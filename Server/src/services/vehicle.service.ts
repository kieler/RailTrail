import { logger } from "../utils/logger"
import database from "./database.service"
import { Vehicle, VehicleType, Track, Tracker, Log } from ".prisma/client"
import TrackService from "./track.service"
import TrackerService from "./tracker.service"
import GeoJSONUtils from "../utils/geojsonUtils"

import along from "@turf/along"
import * as turfHelpers from "@turf/helpers"
import * as turfMeta from "@turf/meta"
import nearestPointOnLine from "@turf/nearest-point-on-line"
import { Position } from "../models/api"

/** Service for vehicle management. */
export default class VehicleService {
	public static async appendLog(
		vehicleId: number,
		position: Position,
		heading: number,
		speed: number
	): Promise<Log | null> {
		// TODO: Is this the right way? Maybe needs a fix when merging related PR for refining DB
		return await database.logs.save({
			timestamp: new Date(),
			vehicleId,
			position: [position.lng, position.lat],
			heading,
			speed
		})
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
	 * * @param track `Track` to search on for vehicles. If none is given and `point` is not a `Vehicle`, the closest will be used.
	 * If none is given and `point` is a `Vehicle`, the assigned track will be used.
	 * @param count amount of vehicles, that should be returned. If none given only one (i.e. the nearest) will be returned.
	 * @param heading could be either 1 or -1 to search for vehicles only towards the end and start of the track (seen from `point`) respectively
	 * @param maxDistance maximum distance in track-kilometers to the vehicles
	 * @param type `VehicleType` to filter the returned vehicles by
	 * @returns `Vehicle[]` either #`count` of nearest vehicles or all vehicles within `distance` of track-kilometers, but at most #`count`.
	 * That is the array could be empty. `null` if an error occurs
	 */
	public static async getNearbyVehicles(
		point: GeoJSON.Feature<GeoJSON.Point> | Vehicle,
		track?: Track,
		count?: number,
		heading?: number,
		maxDistance?: number,
		type?: VehicleType
	): Promise<Vehicle[] | null> {
		// TODO: testing
		// extract vehicle position if a vehicle is given instead of a point
		if ((<Vehicle>point).uid) {
			// also use the assigned track if none is given
			if (track == null) {
				const tempTrack = await database.tracks.getById((<Vehicle>point).trackId)
				if (tempTrack == null) {
					return null
				}
				track = tempTrack
			}

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

			allVehiclesOnTrack.filter(async function (vehicle, index, vehicles) {
				const vehicleTrackKm = await VehicleService.getVehicleTrackDistanceKm(vehicle)
				if (vehicleTrackKm == null) {
					// TODO: log this
					return null
				}
				return vehicleTrackKm - trackDistance * heading > 0
			})
		}

		// filter vehicles by distance if given
		if (maxDistance != null) {
			allVehiclesOnTrack.filter(async function (vehicle, index, vehicles) {
				const vehicleTrackKm = await VehicleService.getVehicleTrackDistanceKm(vehicle)
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
		// if no type is given, this is a simple forward
		if (type == null) {
			return database.vehicles.getAll(track.uid)
		}

		// get all vehicles for track and filter by type
		const vehicles: Vehicle[] = await database.vehicles.getAll(track.uid)
		const filteredVehicles = vehicles.filter(function (vehicle, index, vehicles) {
			return vehicle.typeId == type.uid
		})
		return filteredVehicles
	}

	/**
	 * Compute vehicle position considering different log entries. If the vehicle has no log entries for
	 * the last ten minutes, the last known position will be returned.
	 * @param vehicle `Vehicle` to get the position for
	 * @returns computed position of `vehicle` based on tracker data (besides the GeoJSON point there is
	 * also the track kilometer in the returned GeoJSON properties field), `null` if position is unknown
	 */
	public static async getVehiclePosition(vehicle: Vehicle): Promise<GeoJSON.Feature<GeoJSON.Point> | null> {
		// get all trackers for one vehicle and all positions (including app) from last hour
		const trackers = await database.trackers.getByVehicleId(vehicle.uid)
		// there should be at least one tracker for each vehicle
		// TODO: for testing this was not possible, but for a real production system, this should be implemented again
		if (trackers.length == 0) {
			logger.info(`Cannot find any tracker associated with vehicle ${vehicle.uid}.`)
			// return null
		}

		// if we do not know in which direction we are travelling, the prediction of current positions can not be done
		const track = await database.tracks.getById(vehicle.trackId)
		if (track == null) {
			logger.error(`Assigned track with id ${vehicle.trackId} for vehicle with id ${vehicle.uid} could not be found.`)
			return null
		}

		// used later
		const lineStringData = TrackService.getTrackAsLineString(track)
		if (lineStringData == null) {
			logger.error(`Could not convert track with id ${vehicle.trackId} to a linestring.`)
			return null
		}

		// (this could influence the performance if we get a huge list, what to do?!)
		const allLogs = await database.logs.getNewestLogs(vehicle.uid, 600)

		// vehicle probably did not move in the last ten minutes, so return last known position (from any tracker)
		if (allLogs.length == 0) {
			return this.getLastKnownVehiclePosition(vehicle)
		}

		// create list of all positions used for computation (others in list above are just "helpers")
		// (this is more likely a list of track kilometer values and weights as we project every position on the track anyways)
		let weightedPositions: [number, number][] = []
		// add predicted tracker positions
		for (let i = 0; i < trackers.length; i++) {
			// create list of positions of this specific tracker (also filtered for last ten minutes)
			const trackerLogs = allLogs.filter(function (log) {
				return log.trackerId == trackers[i].uid
			})

			// if trackerPositions is empty at this point we could try other trackers, but we should log this
			if (trackerLogs.length == 0) {
				logger.info(
					`Tracker with id ${trackers[i].uid} did not sent anything for the last ten minutes though the vehicle ${vehicle.uid} seems to be moving.`
				)
				continue
			}

			// get last position for this tracker
			const lastTrackerLog = trackerLogs[0]
			const lastTrackerPosition = GeoJSONUtils.parseGeoJSONFeaturePoint(lastTrackerLog.position)
			if (lastTrackerPosition == null) {
				logger.warn(`Position ${trackerLogs[0].position} is not in GeoJSON-format.`)
				continue
			}

			// predict current tracker position
			const lastTrackKm = await TrackService.getPointTrackKm(lastTrackerPosition, track)
			if (lastTrackKm == null) {
				continue
			}
			const trackHeading = await this.getVehicleTrackHeading(vehicle, lastTrackKm)
			if (trackHeading == 0) {
				logger.warn(`It is not possible to determine any travelling direction for tracker ${trackers[i].uid}.`)
				continue
			}
			const timePassedSec = Date.now() / 1000 - lastTrackerLog.timestamp.getTime() / 1000
			const currentTrackKm = lastTrackKm + lastTrackerLog.speed * (timePassedSec / 3600) * trackHeading
			// compute time factor (time is cut off at 10 minutes)
			// TODO: this could be optimized, e.g. using non-linear weighting and dynamically compute upper bound from last logs
			let timeWeight = (600 - timePassedSec) / 600
			timeWeight = timeWeight > 0 ? timeWeight : 0 // (this should not be needed because of filtering above)

			// compute accuracy factor (cut off at 50 meter distance to track)
			const projectedPoint = nearestPointOnLine(lineStringData, lastTrackerPosition)
			if (projectedPoint.properties.dist == null) {
				// this really should not happen as this is stuff by turf
				logger.error(`Somehow turf did not compute distance to track while computing nearest-point-on-line.`)
				return null
			}
			let accuracy = (50 - projectedPoint.properties.dist * 1000) / 50
			accuracy = accuracy > 0 ? accuracy : 0
			weightedPositions.push([currentTrackKm, timeWeight * accuracy])
		}

		// check if we succeded in predicting at least one tracker position
		// TODO: we should not rely on any app positions for real production system,
		// but we currently do not have more than two trackers total for testing,
		// which is not enough for all tested vehicles
		if (weightedPositions.length == 0) {
			logger.info(`Could not predict any tracker position.`)
		}

		// now also add predicted app positions to computation (at most three, might be inaccurate due to mobility)
		// (only adding last known positions here)
		let appPositions: [number, Log][] = []
		for (let i = 0; i < allLogs.length; i++) {
			const log = allLogs[i]

			// filter for time (everything older than two minutes should not be considered as users might change)
			if (Date.now() / 1000 - log.timestamp.getTime() / 1000 > 120) {
				break
			}

			// filter for app
			if (log.trackerId == null) {
				// parse position from log
				const lastPosition = GeoJSONUtils.parseGeoJSONFeaturePoint(log.position)
				if (lastPosition == null) {
					logger.warn(`Position ${log.position} is not in GeoJSON-format.`)
					continue
				}

				// get last known position (as track kilometer)
				const lastTrackKm = await TrackService.getPointTrackKm(lastPosition, track)
				if (lastTrackKm == null) {
					continue
				}
				appPositions.push([lastTrackKm, log])

				// stop searching for more app logs if we already found three
				if (appPositions.length >= 3) {
					break
				}
			}
		}

		// if we only get one app log we could also just ignore it
		// (this maybe happens when the user just registered their device or if we just catched the very last entry of the last hour)
		if (appPositions.length >= 2) {
			// to predict each app position we use the already acquired data to compute an average speed
			// (the speed could actually be sent with the request, but depends on many factors such as accuracy off the device, users mobility etc.)
			let avgSpeed = 0
			for (let i = 1; i < appPositions.length; i++) {
				const distanceToPrevPos = appPositions[i][0] - appPositions[i - 1][0]
				const timePassedSecToPrevPos =
					appPositions[i][1].timestamp.getTime() / 1000 - appPositions[i - 1][1].timestamp.getTime() / 1000
				avgSpeed += distanceToPrevPos / (timePassedSecToPrevPos / 3600)
			}
			avgSpeed /= appPositions.length - 1

			// append app positions with weights to other positions for computation (weights also compute average of all app positions)
			for (let i = 0; i < appPositions.length; i++) {
				const lastTrackKm = appPositions[i][0]
				const timePassedSec = Date.now() / 1000 - appPositions[i][1].timestamp.getTime() / 1000
				// we do not need to have track heading here as a factor (see above at tracker computation), because it is implicitly given
				// by the averaged speed
				const predictedTrackKm = lastTrackKm + avgSpeed * (timePassedSec / 3600)

				// compute time factor (time is cut off at 2 minutes)
				// TODO: this could be optimized, e.g. using non-linear weighting and dynamically compute upper bound from last logs
				let timeWeight = (120 - timePassedSec) / 120
				timeWeight = timeWeight > 0 ? timeWeight : 0 // (this should not be needed because of filtering above)

				// compute accuracy factor (cut off at 15 meter distance to track)
				const lastPosition = GeoJSONUtils.parseGeoJSONFeaturePoint(appPositions[i][1].position)
				if (lastPosition == null) {
					// at this point this should not happen anymore
					logger.error(`Position ${appPositions[i][1].position} is not in GeoJSON-format, but should be.`)
					return null
				}
				const projectedPoint = nearestPointOnLine(lineStringData, lastPosition)
				if (projectedPoint.properties.dist == null) {
					// this really should not happen as this is stuff by turf
					logger.error(`Somehow turf did not compute distance to track while computing nearest-point-on-line.`)
					return null
				}
				let accuracy = (15 - projectedPoint.properties.dist * 1000) / 15
				accuracy = accuracy > 0 ? accuracy : 0
				weightedPositions.push([predictedTrackKm, timeWeight * accuracy])
			}
		}

		// if we did not add any positions at all, we should return the last known position
		if (weightedPositions.length == 0) {
			logger.info(`Could not find any recent position while trying to compute vehicle's position.`)
			return this.getLastKnownVehiclePosition(vehicle)
		}

		// normalize weights (this could probably be done more elegant)
		let weightSum = 0
		for (let i = 0; i < weightedPositions.length; i++) {
			weightSum += weightedPositions[i][1]
		}

		// avoid divide by zero
		if (weightSum == 0) {
			logger.info(`Could not compute vehicle position, because no log is accurate and recent enough respectively.`)

			// instead just return the last known position
			return this.getLastKnownVehiclePosition(vehicle)
		}

		let avgTrackKm = 0
		for (let i = 0; i < weightedPositions.length; i++) {
			weightedPositions[i][1] /= weightSum

			// also calculating average track kilometer here
			avgTrackKm += weightedPositions[i][0] * weightedPositions[i][1]
		}

		// in the end we just need to turn the track kilometer into a position again
		const avgPosition = along(lineStringData, avgTrackKm)
		GeoJSONUtils.setTrackKm(avgPosition, avgTrackKm)
		return avgPosition
	}

	/**
	 *
	 * @param vehicle `Vehicle` to get the last known position from
	 * @returns the last known position of `vehicle` mapped on its track, null if an error occurs
	 */
	private static async getLastKnownVehiclePosition(vehicle: Vehicle): Promise<GeoJSON.Feature<GeoJSON.Point> | null> {
		// TODO: this could be optimized by computing an average position from all last entries by all trackers

		// get last log and track of vehicle
		const lastLog = await database.logs.getAll(vehicle.uid, undefined, 1)
		if (lastLog.length != 1) {
			logger.error(`No log entry for vehicle ${vehicle.uid} was found.`)
			return null
		}

		const track = await database.tracks.getById(vehicle.trackId)
		if (track == null) {
			logger.error(`Could not find track with id ${vehicle.trackId}.`)
			return null
		}

		// parsing to GeoJSON
		const geoJSONPoint = GeoJSONUtils.parseGeoJSONFeaturePoint(lastLog[0].position)
		if (geoJSONPoint == null) {
			logger.error(`Could not parse the last known position of vehicle with id ${vehicle.uid}.`)
			return null
		}

		// mapping on track
		return TrackService.getProjectedPointOnTrack(geoJSONPoint, track)
	}

	/**
	 * Just a wrapper for getting position of a vehicle to get its distance along the track.
	 * @param vehicle `Vehicle` to get the distance for
	 * @returns distance of `vehicle` as kilometers along the track, `null` if not possible
	 */
	public static async getVehicleTrackDistanceKm(vehicle: Vehicle): Promise<number | null> {
		// get track point of vehicle
		const vehicleTrackPoint = await this.getVehiclePosition(vehicle)
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
	 * @returns distance of `vehicle` as percentage along the track, `null` if not possible
	 */
	public static async getVehicleTrackDistancePercentage(vehicle: Vehicle): Promise<number | null> {
		// get track
		const track = await database.tracks.getById(vehicle.trackId)
		if (track == null) {
			// TODO: logging
			return null
		}

		// get distance of vehicle and length of track and check for success
		const trackLength = TrackService.getTrackLength(track)
		const vehicleDistance = await this.getVehicleTrackDistanceKm(vehicle)
		if (trackLength == null || vehicleDistance == null) {
			return null
		}

		// return percentage
		return (vehicleDistance / trackLength) * 100
	}

	/**
	 * Compute average heading of all trackers assigned to a specified vehicle.
	 * No headings from app will be used here due to mobility.
	 * @param vehicle `Vehicle` to get the heading for
	 * @returns average heading (between 0 and 359) of `vehicle` based on tracker data, -1 if heading is unknown
	 */
	public static async getVehicleHeading(vehicle: Vehicle): Promise<number> {
		// get all trackers for given vehicle
		const trackers = await database.trackers.getByVehicleId(vehicle.uid)
		if (trackers.length == 0) {
			logger.error(`No tracker found for vehicle ${vehicle.uid}.`)
			return -1
		}

		// get all last known tracker logs
		let lastLogs: Log[] = []
		for (let i = 0; i < trackers.length; i++) {
			// get last log entry for this tracker
			const lastLog = await database.logs.getAll(vehicle.uid, trackers[i].uid, 1)
			if (lastLog.length != 1) {
				// just try other trackers if there are no logs for this tracker
				logger.warn(`Did not find any entry for vehicle ${vehicle.uid} and tracker ${trackers[i].uid}.`)
				continue
			}
			lastLogs.push(lastLog[0])
		}

		// check if we got any log
		if (lastLogs.length == 0) {
			logger.error(`Could not find any tracker log for vehicle ${vehicle.uid}`)
			return -1
		}

		// actually computing average
		let avgHeading = 0
		for (let i = 0; i < lastLogs.length; i++) {
			avgHeading += lastLogs[i].heading / lastLogs.length
		}
		return avgHeading
	}

	/**
	 * Determine heading of a vehicle related to its track (either "forward" or "backward")
	 * @param vehicle `Vehicle` to get the heading for
	 * @param trackKm track kilometer at which the vehicle currently is (can be found with `VehicleService.getVehicleTrackDistanceKm`)
	 * @returns 1 or -1 if the vehicle is heading towards the end and start of the track respectively, 0 if heading is unknown
	 */
	public static async getVehicleTrackHeading(vehicle: Vehicle, trackKm: number): Promise<number> {
		// TODO: this should be tested

		// get track
		const track = await database.tracks.getById(vehicle.trackId)
		if (track == null) {
			// TODO: log
			return 0
		}

		// get (normal) heading and position of vehicle
		const vehicleHeading = await this.getVehicleHeading(vehicle)

		// finally compute track heading
		const trackBearing = await TrackService.getTrackHeading(track, trackKm)
		if (trackBearing == null) {
			// TODO: log this
			return 0
		}
		// TODO: maybe give this a buffer of uncertainty
		if (vehicleHeading - trackBearing < 90 || vehicleHeading - trackBearing > -90) {
			return 1
		} else {
			return -1
		}
	}

	/**
	 * Compute average speed of all trackers assigned to a specified vehicle.
	 * No speed from app will be used here due to mobility.
	 * @param vehicle `Vehicle` to get the speed for
	 * @returns average speed of `vehicle` based on tracker data, -1 if heading is unknown
	 */
	public static async getVehicleSpeed(vehicle: Vehicle): Promise<number> {
		// get all trackers for given vehicle
		const trackers = await database.trackers.getByVehicleId(vehicle.uid)
		if (trackers.length == 0) {
			logger.error(`No tracker found for vehicle ${vehicle.uid}.`)
			return -1
		}

		// get all last known tracker logs
		let lastLogs: Log[] = []
		for (let i = 0; i < trackers.length; i++) {
			// get last log entry for this tracker
			const lastLog = await database.logs.getAll(vehicle.uid, trackers[i].uid, 1)
			if (lastLog.length != 1) {
				// just try other trackers if there are no logs for this tracker
				logger.warn(`Did not find any entry for vehicle ${vehicle.uid} and tracker ${trackers[i].uid}.`)
				continue
			}
			lastLogs.push(lastLog[0])
		}

		// check if we got any log
		if (lastLogs.length == 0) {
			logger.error(`Could not find any tracker log for vehicle ${vehicle.uid}`)
			return -1
		}

		// actually computing average
		let avgSpeed = 0
		for (let i = 0; i < lastLogs.length; i++) {
			avgSpeed += lastLogs[i].speed / lastLogs.length
		}
		return avgSpeed
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
