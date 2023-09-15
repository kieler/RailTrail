import { logger } from "../utils/logger"
import database from "./database.service"
import { Log, Track, Vehicle, VehicleType } from ".prisma/client"
import TrackService from "./track.service"
import GeoJSONUtils from "../utils/geojsonUtils"

import along from "@turf/along"
import nearestPointOnLine from "@turf/nearest-point-on-line"
import { Position } from "../models/api"
import { z } from "zod"
import { HTTPError } from "../models/error"
import { Feature, GeoJsonProperties, Point } from "geojson"

/**
 * Data structure used by `getVehicleData` for data related to a certain `vehicle` with:
 * - `position` (mapped on track)
 * - `trackKm` (extracted from `position`)
 * - `percentagePosition` respective to track kilometer
 * - `speed`
 * - `heading` (mapped on track path)
 * - `direction` (1 if travelling to the end of the track, -1 accordingly)
 */
export type VehicleData = {
	vehicle: Vehicle
	position: GeoJSON.Feature<GeoJSON.Point>
	trackKm?: number
	percentagePosition?: number
	speed: number
	heading: number
	direction?: -1 | 1
}

/** Service for vehicle management. */
export default class VehicleService {
	public static async appendLog(
		vehicleId: number,
		position: z.infer<typeof Position>,
		heading: number,
		speed: number
	): Promise<Log> {
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
	 * Compute all data (e.g. position, speed and heading) for a given vehicle
	 * @param vehicle `Vehicle` to compute data for
	 * @returns current `VehicleData` of `vehicle`, if no recent logs from an app are available `direction`, `trackKm`
	 * and `percentagePosition` are not set and `heading` and `speed` are just from the tracker, also `position` is not
	 * mapped on the track
	 */
	public static async getVehicleData(vehicle: Vehicle): Promise<VehicleData> {
		// initialize track
		const track = await database.tracks.getById(vehicle.trackId)

		// initialize logs for trackers
		const trackers = await database.trackers.getByVehicleId(vehicle.uid)
		const trackerLogs: Log[] = []
		for (let i = 0; i < trackers.length; i++) {
			let trackerLog: Log
			try {
				trackerLog = await database.logs.getLatestLog(vehicle.uid, trackers[i].uid)
			} catch (_err) {
				logger.warn(`No log found for tracker with id ${trackers[i].uid}.`)
				continue
			}
			trackerLogs.push(trackerLog)
		}

		// initialize logs for apps and filter them, so we only have 10 at most from different points in time
		let lastTimeLog = Date.now() + 3000
		const appLogs = (await database.logs.getNewestLogs(vehicle.uid, 30, null)).filter(function (log) {
			if (lastTimeLog - log.timestamp.getTime() > 3000) {
				lastTimeLog = log.timestamp.getTime()
				return true
			}
			return false
		})

		// check if we have any logs
		if (appLogs.length === 0 && trackerLogs.length === 0) {
			throw new HTTPError(
				`There are no recent app logs and no tracker logs at all for vehicle with id ${vehicle.uid}.`,
				404
			)
		}

		// fallback solution if there are no app logs
		let position: Feature<Point, GeoJsonProperties> | null = null
		if (trackerLogs.length > 0) {
			position = GeoJSONUtils.parseGeoJSONFeaturePoint(trackerLogs[0].position)
			if (position == null) {
				throw new HTTPError(`Could not parse position ${JSON.stringify(trackerLogs[0].position)}.`, 500)
			}
		}

		// get heading and speed
		const heading = this.computeVehicleHeading(appLogs.concat(trackerLogs))
		const speed = this.computeVehicleSpeed(appLogs.concat(trackerLogs))

		// check if we can compute current position with app logs
		if (appLogs.length === 0) {
			// in this case we need to add the track kilometer value
			logger.info(`No recent app logs of vehicle with id ${vehicle.uid} were found.`)
			if (position == null) {
				throw new HTTPError("Cannot calculate position, no position data from app or tracker", 500)
			}
			position = TrackService.getProjectedPointOnTrack(position, track)
		} else {
			// compute position and track kilometer as well as percentage value
			position = this.computeVehiclePosition(trackerLogs, appLogs, heading, speed, track)
		}

		if (position == null) {
			throw new HTTPError(`Could not compute position for vehicle with id ${vehicle.uid}.`, 500)
		}

		const trackKm = GeoJSONUtils.getTrackKm(position)
		if (trackKm == null) {
			throw new HTTPError(`Could not get track kilometer of position ${JSON.stringify(position)}.`, 500)
		}
		const percentagePosition = TrackService.getTrackKmAsPercentage(trackKm, track)
		if (percentagePosition == null) {
			throw new HTTPError(
				`Could not compute percentage position for track kilometer ${trackKm} on track with id ${track.uid}.`,
				500
			)
		}

		return {
			vehicle,
			position,
			trackKm,
			percentagePosition,
			heading,
			speed,
			direction: this.computeVehicleTravellingDirection(trackKm, heading, track)
		}
	}

	/**
	 * Compute vehicle position considering different log entries.
	 * @param trackerLogs all latest logs of all trackers of the related vehicle
	 * @param appLogs some recent logs of apps of the related vehicle
	 * @param vehicleHeading heading of vehicle (0-359), can be obtained with `getVehicleHeading`
	 * @param vehicleSpeed heading of vehicle (>= 0), can be obtained with `getVehicleSpeed`
	 * @param track `Track` assigned to the vehicle
	 * @returns computed position of the vehicle based on log data, besides the GeoJSON point there is
	 * also the track kilometer in the returned GeoJSON properties field (could be null if an error occurs)
	 */
	private static computeVehiclePosition(
		trackerLogs: Log[],
		appLogs: Log[],
		vehicleHeading: number,
		vehicleSpeed: number,
		track: Track
	): GeoJSON.Feature<GeoJSON.Point> | null {
		const lineStringData = TrackService.getTrackAsLineString(track)
		if (lineStringData == null) {
			logger.error(`Could not convert track with id ${track.uid} to a linestring.`)
			// fallback
			return GeoJSONUtils.parseGeoJSONFeaturePoint(trackerLogs[0].position)
		}

		// add a weight to the tracker logs
		const weightedTrackerLogs = this.addWeightToLogs(trackerLogs, lineStringData)

		// list of all resulting track kilometers
		const weightedTrackKm: [number, number][] = []

		// convert weighted tracker logs to weighted track kilometers (by projecting positions onto the track)
		if (weightedTrackerLogs.length === 0) {
			// now it is unlikely, that weights can be added to the app logs, but we could at least try it
			logger.warn(`Could not add any weights to tracker logs.`)
		} else {
			const tempWeightedTrackKm = this.weightedLogsToWeightedTrackKm(
				weightedTrackerLogs,
				vehicleSpeed,
				vehicleHeading,
				track
			)
			if (tempWeightedTrackKm == null) {
				// (if this does not work we can still try app logs, though it is also unlikely to work)
				logger.warn(`Could not convert weighted tracker logs to weighted track kilometers.`)
			} else {
				weightedTrackKm.push(...tempWeightedTrackKm)
			}
		}

		// add weight to app logs
		const weightedAppLogs = this.addWeightToLogs(appLogs, lineStringData, 30, 15, true)
		if (weightedAppLogs.length === 0) {
			logger.warn(`Could not add any weights to app logs.`)
		} else {
			// try adding them to the list as well
			const tempWeightedTrackKm = this.weightedLogsToWeightedTrackKm(
				weightedAppLogs,
				vehicleSpeed,
				vehicleHeading,
				track
			)
			if (tempWeightedTrackKm == null) {
				logger.warn(`Could not convert weighted app logs to weighted track kilometers.`)
			} else {
				weightedTrackKm.push(...tempWeightedTrackKm)
			}
		}

		// if we did not add any positions at all, we should return the last known position
		if (weightedTrackKm.length == 0) {
			logger.info(`Could not find any recent position while trying to compute vehicle's position.`)
			return GeoJSONUtils.parseGeoJSONFeaturePoint(trackerLogs[0].position)
		}

		// build average track kilometer value
		const avgTrackKm = this.averageWeightedTrackKmValues(weightedTrackKm)
		if (avgTrackKm == null) {
			logger.info(`Could not compute average track kilometer. Perhaps the logs were not recent or accurate enough.`)
			return GeoJSONUtils.parseGeoJSONFeaturePoint(trackerLogs[0].position)
		}

		// in the end we just need to turn the track kilometer into a position again
		const avgPosition = along(lineStringData, avgTrackKm)
		GeoJSONUtils.setTrackKm(avgPosition, avgTrackKm)
		return avgPosition
	}

	/**
	 * Convert list of weighted logs to list of weighted (current / predicted) track kilometer values
	 * @param weightedLogs list of weighted logs to be converted, all need to be from the same vehicle
	 * @param vehicleSpeed heading of vehicle (>= 0), can be obtained with `getVehicleSpeed`
	 * @param vehicleHeading heading of vehicle (0-359), can be obtained with `getVehicleHeading`
	 * @param track related track of `weightedLogs`
	 * @returns list of weighted track kilometer values, could be less than count of `weightedLogs` (and even 0) if an error occurs
	 */
	private static weightedLogsToWeightedTrackKm(
		weightedLogs: [Log, number][],
		vehicleSpeed: number,
		vehicleHeading: number,
		track: Track
	): [number, number][] {
		// just need to check this for the next step
		if (weightedLogs.length === 0) {
			return []
		}

		// vehicle should be the same for all logs
		const vehicleId = weightedLogs[0][0].vehicleId

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
			const lastTrackKm = this.getTrackKmFromLog(weightedLogs[i][0], track)
			if (lastTrackKm == null) {
				logger.warn(`Could not compute last track kilometer for last log with id ${weightedLogs[i][0].uid}.`)
				continue
			}

			// get travelling direction
			// TODO: should be a parameter replacing vehicleHeading (function needs to be adjusted for that)
			const trackHeading = this.computeVehicleTravellingDirection(lastTrackKm, vehicleHeading, track)

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
	 * @param track related track of `log`
	 * @returns track kilometer value for `log`, `null` if an error occurs
	 */
	private static getTrackKmFromLog(log: Log, track: Track): number | null {
		// get position from log
		const logPosition = GeoJSONUtils.parseGeoJSONFeaturePoint(log.position)
		if (logPosition == null) {
			logger.error(`Position ${JSON.stringify(log.position)} could not be parsed.`)
			return null
		}

		// compute track kilometer for this position
		const logTrackKm = TrackService.getPointTrackKm(logPosition, track)
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
	private static addWeightToLogs(
		logs: Log[],
		lineStringOfTrack: GeoJSON.Feature<GeoJSON.LineString>,
		timeCutoff = 180,
		distanceCutoff = 50,
		averaging: boolean = false
	): [Log, number][] {
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
	private static averageWeightedTrackKmValues(weightedTrackKms: [number, number][]): number | null {
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
	 * Compute heading for given vehicle
	 * @param vehicle `Vehicle` to get heading for
	 * @returns heading (0-359) of `vehicle` mapped on track
	 * @todo does not get mapped on track yet
	 */
	public static async getVehicleHeading(vehicle: Vehicle): Promise<number> {
		// initialize app logs and compute heading with them
		const appLogs = (await database.logs.getNewestLogs(vehicle.uid, 30)).filter(function (log) {
			return log.trackerId == null
		})
		return this.computeVehicleHeading(appLogs)
	}

	/**
	 * Compute average heading of given tracker logs
	 * @param logs logs to get the average heading from
	 * @returns average heading (between 0 and 359) of `logs`
	 */
	private static computeVehicleHeading(logs: Log[]): number {
		// TODO: needs to be improved (see #118)
		let avgHeading = 0
		for (let i = 0; i < logs.length; i++) {
			avgHeading += logs[i].heading / logs.length
		}
		return avgHeading
	}

	/**
	 * Determine travelling direction of a vehicle related to its track (either "forward" or "backward")
	 * @param vehicleHeading heading of vehicle (0-359), can be obtained with `getVehicleHeading`
	 * @param trackKm track kilometer at which the vehicle currently is (can be found with `VehicleService.getVehicleTrackDistanceKm`)
	 * @param track track to compute the direction of a vehicle with
	 * @returns 1 or -1 if the vehicle is heading towards the end and start of the track respectively
	 */
	private static computeVehicleTravellingDirection(trackKm: number, vehicleHeading: number, track: Track): 1 | -1 {
		// TODO: needs improvements (probably with #118 together), should be independent from track kilometer (position needs to be computed for that)
		// compute track heading
		const trackBearing = TrackService.getTrackHeading(track, trackKm)
		// TODO
		if (trackBearing == null) {
			throw new HTTPError(`Could not compute heading of track with id ${track.uid} at track kilometer ${trackKm}.`, 500)
		}
		// TODO: maybe give this a buffer of uncertainty
		if (vehicleHeading - trackBearing < 90 || vehicleHeading - trackBearing > -90) {
			return 1
		} else {
			return -1
		}
	}

	/**
	 * Compute speed of given vehicle
	 * @param vehicle `Vehicle` to get speed for
	 * @returns speed of `vehicle`
	 */
	public static async getVehicleSpeed(vehicle: Vehicle): Promise<number> {
		// initialize app logs and compute speed with them
		const appLogs = (await database.logs.getNewestLogs(vehicle.uid, 30)).filter(function (log) {
			return log.trackerId == null
		})
		return this.computeVehicleSpeed(appLogs)
	}

	/**
	 * Compute average speed of given logs
	 * @param logs logs to get the average speed from
	 * @returns average speed of `logs`
	 */
	private static computeVehicleSpeed(logs: Log[]): number {
		// TODO: needs improvement (see #132)
		let avgSpeed = 0
		for (let i = 0; i < logs.length; i++) {
			avgSpeed += logs[i].speed / logs.length
		}
		return avgSpeed
	}
}
