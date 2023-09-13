import { logger } from "../utils/logger"
import database from "./database.service"
import { Log, Track, Vehicle, VehicleType } from ".prisma/client"
import TrackService from "./track.service"
import GeoJSONUtils from "../utils/geojsonUtils"

import along from "@turf/along"
import nearestPointOnLine from "@turf/nearest-point-on-line"
import { Position } from "../models/api"
import { z } from "zod"

/** Service for vehicle management. */
export default class VehicleService {
	public static async appendLog(
		vehicleId: number,
		position: z.infer<typeof Position>,
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
		const filteredVehicles = vehicles.filter(function (vehicle, _index, _vehicles) {
			return vehicle.typeId == type.uid
		})
		return filteredVehicles
	}

	/**
	 * Compute vehicle position considering different log entries.
	 * @param vehicle `Vehicle` to get the position for
	 * @returns computed position of `vehicle` based on tracker data (besides the GeoJSON point there is
	 * also the track kilometer in the returned GeoJSON properties field), `null` if an error occurs
	 */
	public static async getVehiclePosition(vehicle: Vehicle): Promise<GeoJSON.Feature<GeoJSON.Point> | null> {
		// get track and related track data as linestring (used later)
		const track = await database.tracks.getById(vehicle.trackId)
		if (track == null) {
			logger.error(`Assigned track with id ${vehicle.trackId} for vehicle with id ${vehicle.uid} could not be found.`)
			// fallback
			return this.getLastKnownVehiclePosition(vehicle)
		}
		const lineStringData = TrackService.getTrackAsLineString(track)
		if (lineStringData == null) {
			logger.error(`Could not convert track with id ${vehicle.trackId} to a linestring.`)
			// fallback
			return this.getLastKnownVehiclePosition(vehicle)
		}

		// get all trackers for given vehicle
		const trackers = await database.trackers.getByVehicleId(vehicle.uid)
		// there should be at least one tracker for each vehicle
		// TODO: for testing this was not possible, but for a real production system all vehicles should have at least one tracker again
		if (trackers.length == 0) {
			logger.info(`Could not find any tracker associated with vehicle ${vehicle.uid}.`)
			// return null
		}

		// get all latest tracker logs
		const trackerLogs: Log[] = []
		for (let i = 0; i < trackers.length; i++) {
			const latestTrackerLog = await database.logs.getAll(vehicle.uid, trackers[i].uid, 1)
			if (latestTrackerLog.length != 1) {
				logger.warn(`No last log entry was found for tracker with id ${trackers[i].uid}.`)
				continue
			}
			trackerLogs.push(latestTrackerLog[0])
		}

		// add a weight to the tracker logs
		const weightedTrackerLogs = await this.addWeightToLogs(trackerLogs, lineStringData)

		// list of all resulting track kilometers
		const weightedTrackKm: [number, number][] = []

		// convert weighted tracker logs to weighted track kilometers (by projecting positions onto the track)
		if (weightedTrackerLogs == null) {
			// now it is unlikely, that weights can be added to the app logs, but we could at least try it
			logger.warn(`Could not add weights to tracker logs for vehicle with id ${vehicle.uid}.`)
		} else {
			const tempWeightedTrackKm = await this.weightedLogsToWeightedTrackKm(weightedTrackerLogs, track)
			if (tempWeightedTrackKm == null) {
				// (if this does not work we can still try app logs, though it is also unlikely to work)
				logger.warn(
					`Could not convert weighted tracker logs to weighted track kilometers for vehicle with id ${vehicle.uid}.`
				)
			} else {
				weightedTrackKm.push(...tempWeightedTrackKm)
			}
		}

		// get app logs from last 30 seconds (because they do not have any tracker id, we cannot do it the same way as above)
		const appLogs = (await database.logs.getNewestLogs(vehicle.uid, 30)).filter(function (log) {
			return log.trackerId == null
		})
		// add weight to app logs
		const weightedAppLogs = await this.addWeightToLogs(appLogs, lineStringData, 30, 15, true)
		if (weightedAppLogs == null) {
			logger.warn(`Could not add weights to app logs for vehicle with id ${vehicle.uid}.`)
		} else {
			// try adding them to the list as well
			const tempWeightedTrackKm = await this.weightedLogsToWeightedTrackKm(weightedAppLogs, track)
			if (tempWeightedTrackKm == null) {
				logger.warn(
					`Could not convert weighted app logs to weighted track kilometers for vehicle with id ${vehicle.uid}.`
				)
			} else {
				weightedTrackKm.push(...tempWeightedTrackKm)
			}
		}

		// if we did not add any positions at all, we should return the last known position
		if (weightedTrackKm.length == 0) {
			logger.info(`Could not find any recent position while trying to compute vehicle's position.`)
			return this.getLastKnownVehiclePosition(vehicle)
		}

		// build average track kilometer value
		const avgTrackKm = await this.averageWeightedTrackKmValues(weightedTrackKm)
		if (avgTrackKm == null) {
			logger.info(`Could not compute average track kilometer. Perhaps the logs were not recent or accurate enough.`)
			return this.getLastKnownVehiclePosition(vehicle)
		}

		// in the end we just need to turn the track kilometer into a position again
		const avgPosition = along(lineStringData, avgTrackKm)
		GeoJSONUtils.setTrackKm(avgPosition, avgTrackKm)
		return avgPosition
	}

	/**
	 * Convert list of weighted logs to list of weighted (current / predicted) track kilometer values
	 * @param weightedLogs list of weighted logs to be converted, all need to be from the same vehicle
	 * @param track optional track, which can be provided, if already computed
	 * @returns list of weighted track kilometer values, could be less than count of `weightedLogs` (and even 0) if an error occurs
	 */
	private static async weightedLogsToWeightedTrackKm(
		weightedLogs: [Log, number][],
		track?: Track
	): Promise<[number, number][] | null> {
		// just need to check this for the next step
		if (weightedLogs.length === 0) {
			return []
		}

		// vehicle should be the same for all logs
		const vehicleId = weightedLogs[0][0].vehicleId
		const vehicle = await database.vehicles.getById(vehicleId)
		if (vehicle == null) {
			logger.warn(`Vehicle with id ${weightedLogs[0][0].vehicleId} was not found.`)
			return null
		}

		// check if we need to compute vehicle speed or just use the stored speed in the logs
		const vehicleSpeed = await this.getVehicleSpeed(vehicle)
		if (vehicleSpeed < 0) {
			logger.error(`Could not compute speed for vehicle with id ${vehicle.uid}.`)
			return null
		}

		// predict their current position
		const weightedTrackKms: [number, number][] = []
		for (let i = 0; i < weightedLogs.length; i++) {
			// check vehicle id
			if (weightedLogs[i][0].vehicleId !== vehicleId) {
				logger.warn(
					`Log with id ${weightedLogs[i][0].uid} is not of expected vehicle with id ${vehicleId}, but of vehicle with id ${weightedLogs[i][0].vehicleId}.`
				)
				continue
			}

			// get last known track kilometer
			const lastTrackKm = await this.getTrackKmFromLog(weightedLogs[i][0], track)
			if (lastTrackKm == null) {
				logger.warn(`Could not compute last track kilometer for last log with id ${weightedLogs[i][0].uid}.`)
				continue
			}

			// get travelling direction
			const trackHeading = await this.getVehicleTrackHeading(vehicle, lastTrackKm)
			if (trackHeading === 0) {
				logger.warn(
					`Could not determine travelling direction of vehicle with id ${vehicle.uid} by log with id ${weightedLogs[i][0].uid}.`
				)
				continue
			}

			// calculate the current track kilometer and add it to the list
			const timePassedSec = Date.now() / 1000 - weightedLogs[i][0].timestamp.getTime() / 1000
			const currentTrackKm = lastTrackKm + vehicleSpeed * (timePassedSec / 3600) * trackHeading
			weightedTrackKms.push([currentTrackKm, weightedLogs[i][1]])
		}
		return weightedTrackKms
	}

	/**
	 * Compute track kilometer for a position of a given log
	 * @param log `Log` to compute track kilometer for
	 * @param track optional track, that can be provided if already computed,
	 * if none is given the track of the vehicle of the given `log` will be used
	 * @returns track kilometer value for `log`, `null` if an error occurs
	 */
	private static async getTrackKmFromLog(log: Log, track?: Track): Promise<number | null> {
		// check if track is given and if not initialize it
		if (track == null) {
			const vehicle = await database.vehicles.getById(log.vehicleId)
			if (vehicle == null) {
				logger.error(
					`Vehicle with id ${log.vehicleId} was not found while trying to look up track for log with id ${log.uid}.`
				)
				return null
			}

			const logTrack = await database.tracks.getById(vehicle.trackId)
			if (logTrack == null) {
				logger.error(`Track with id ${vehicle.trackId} was not found.`)
				return null
			}
			track = logTrack
		}

		// get position from log
		const logPosition = GeoJSONUtils.parseGeoJSONFeaturePoint(log.position)
		if (logPosition == null) {
			logger.error(`Position ${JSON.stringify(log.position)} could not be parsed.`)
			return null
		}

		// compute track kilometer for this position
		const logTrackKm = await TrackService.getPointTrackKm(logPosition, track)
		if (logTrackKm == null) {
			logger.error(
				`Could not compute track kilometer for position ${JSON.stringify(logPosition)} and track with id ${track.uid}.`
			)
			return null
		}

		return logTrackKm
	}

	/**
	 * Add different factors to the weights of each Log
	 * @param logs list of `Log`s to add a weight to
	 * @param lineStringOfTrack GeoJSON linestring of geographical track data
	 * @param timeCutoff value to cut the time factor off at, default is 180 seconds (recommended for tracker logs)
	 * @param distanceCutoff value to cut the distance / accuracy factor off at, default is 50 meters (recommended for tracker logs)
	 * @param averaging flag to decide wether all Logs should be averaged via their related weight
	 * @returns list of `Log`s, each associated with a weight, could be less than count of `logs` (and even 0) if an error occurs
	 */
	private static async addWeightToLogs(
		logs: Log[],
		lineStringOfTrack: GeoJSON.Feature<GeoJSON.LineString>,
		timeCutoff = 180,
		distanceCutoff = 50,
		averaging: boolean = false
	): Promise<[Log, number][] | null> {
		// resulting list
		const weightedLogs: [Log, number][] = []

		// check and compute averaging
		const averageFactor = averaging ? 1 / logs.length : 1

		for (let i = 0; i < logs.length; i++) {
			// compute time factor (linear)
			const timePassedSec = Date.now() / 1000 - logs[i].timestamp.getTime() / 1000
			let timeWeight = (timeCutoff - timePassedSec) / timeCutoff
			timeWeight = timeWeight > 0 ? timeWeight : 0

			// get position from log
			const logPosition = GeoJSONUtils.parseGeoJSONFeaturePoint(logs[i].position)
			if (logPosition == null) {
				logger.warn(`Position ${JSON.stringify(logs[i].position)} could not be parsed.`)
				continue
			}

			// compute distance to track
			const projectedPoint = nearestPointOnLine(lineStringOfTrack, logPosition)
			if (projectedPoint.properties.dist == null) {
				// this really should not happen as this is stuff by turf
				logger.warn(`Turf error: Distance to linestring was not computed by nearest-point-on-line.`)
				continue
			}

			// compute accuracy factor (linear)
			let accuracy = (distanceCutoff - projectedPoint.properties.dist * 1000) / distanceCutoff
			accuracy = accuracy > 0 ? accuracy : 0

			// add log and its weight to the list
			weightedLogs.push([logs[i], timeWeight * accuracy * averageFactor])
		}

		return weightedLogs
	}

	/**
	 * Build average of weighted track kilometer values
	 * @param weightedTrackKms list of track kilometer values (first) with their related positive weight (second)
	 * @returns averaged track kilometer value of `weightedTrackKms`, null if an error occurs
	 */
	private static async averageWeightedTrackKmValues(weightedTrackKms: [number, number][]): Promise<number | null> {
		// calculate total of all weights
		let weightSum = 0
		for (let i = 0; i < weightedTrackKms.length; i++) {
			// check if weight is negative (this could result in unwanted behaviour)
			if (weightedTrackKms[i][1] < 0) {
				logger.error(`Expected positive weights for track kilometer values only, but got ${weightedTrackKms[i][1]}.`)
				return null
			}

			weightSum += weightedTrackKms[i][1]
		}

		// avoid divide by zero
		if (weightSum == 0) {
			logger.error(`All weights for track kilometers were 0`)
			return null
		}

		// normalizing weights and averaging track kilometer values
		let avgTrackKm = 0
		for (let i = 0; i < weightedTrackKms.length; i++) {
			weightedTrackKms[i][1] /= weightSum

			// also calculating average track kilometer here
			avgTrackKm += weightedTrackKms[i][0] * weightedTrackKms[i][1]
		}

		return avgTrackKm
	}

	/**
	 *
	 * @param vehicle `Vehicle` to get the last known position from
	 * @returns the last known position of `vehicle` mapped on its track, null if an error occurs
	 */
	private static async getLastKnownVehiclePosition(vehicle: Vehicle): Promise<GeoJSON.Feature<GeoJSON.Point> | null> {
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
		const lastLogs: Log[] = []
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
			logger.error(`Track with id ${vehicle.trackId} was not found.`)
			return 0
		}

		// get (normal) heading and position of vehicle
		const vehicleHeading = await this.getVehicleHeading(vehicle)

		// finally compute track heading
		const trackBearing = await TrackService.getTrackHeading(track, trackKm)
		if (trackBearing == null) {
			logger.error(`Could not compute heading of track with id ${track.uid} at track kilometer ${trackKm}.`)
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
		// TODO: remove necessity of trackers
		const trackers = await database.trackers.getByVehicleId(vehicle.uid)
		if (trackers.length == 0) {
			logger.error(`No tracker found for vehicle ${vehicle.uid}.`)
			return -1
		}

		// get all last known tracker logs
		const lastLogs: Log[] = []
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
}
