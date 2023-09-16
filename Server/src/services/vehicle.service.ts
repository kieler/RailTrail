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
	trackKm: number
	percentagePosition: number
	speed: number
	heading: number
	direction: -1 | 1
}

/** Service for vehicle management. */
export default class VehicleService {
	/**
	 * Append log for a given vehicle
	 * @param vehicleId vehicle id to append the log for
	 * @param position position of the vehicle
	 * @param heading heading of the vehicle
	 * @param speed speed of the vehicle
	 * @returns appended log if successful
	 * @throws PrismaError, if appending log in the database was not possible
	 */
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
	 * @throws `HTTPError`
	 * 	- if there are no recent logs of an app and no tracker logs at all
	 * 	- if the position could not be computed
	 * 	- if the track kilometer value of the position could not be accessed
	 * 	- if the tracker position could not be parsed
	 * 	- if the position of the vehicle as percentage on the track could not be computed
	 * 	- if the position could not be projected onto the track
	 * 	- if the travelling direction could not be computed
	 * @throws PrismaError
	 * 	- if track of vehicle could not be accessed in the database
	 * 	- if no last log of an existing tracker could be found in the database
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

		// initialize logs for apps and check if there are any
		const appLogs = (await database.logs.getNewestLogs(vehicle.uid, 30)).filter(function (log) {
			return log.trackerId == null
		})
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
			// TODO: try-catch and fallback (should be done in #169)
			position = this.computeVehiclePosition(trackerLogs, appLogs, heading, speed, track)
		}

		if (position == null) {
			throw new HTTPError(`Could not compute position for vehicle with id ${vehicle.uid}.`, 500)
		}

		const trackKm = GeoJSONUtils.getTrackKm(position)

		return {
			vehicle,
			position,
			trackKm,
			percentagePosition: TrackService.getTrackKmAsPercentage(trackKm, track),
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
	 * also the track kilometer in the returned GeoJSON properties field
	 * @throws `HTTPError`
	 * 	- if the linestring of `track` could not be computed
	 * 	- if the tracker position could not be parsed
	 * 	- if adding weights to logs was not possible
	 * 	- if the weighted logs could not be converted to weighted track kilometer values
	 * 	- if averaging weighted logs was not possible
	 */
	private static computeVehiclePosition(
		trackerLogs: Log[],
		appLogs: Log[],
		vehicleHeading: number,
		vehicleSpeed: number,
		track: Track
	): GeoJSON.Feature<GeoJSON.Point> {
		const lineStringData = TrackService.getTrackAsLineString(track)

		// add a weight to the tracker logs
		const weightedTrackerLogs = this.addWeightToLogs(trackerLogs, lineStringData)

		// list of all resulting track kilometers
		const weightedTrackKm: [number, number][] = []

		// convert weighted tracker logs to weighted track kilometers (by projecting positions onto the track)
		if (weightedTrackerLogs.length === 0) {
			// now it is unlikely, that weights can be added to the app logs, but we could at least try it
			logger.warn(`Could not add any weights to tracker logs.`)
		} else {
			let tempWeightedTrackKm
			try {
				tempWeightedTrackKm = this.weightedLogsToWeightedTrackKm(
					weightedTrackerLogs,
					vehicleSpeed,
					vehicleHeading,
					track
				)
				weightedTrackKm.push(...tempWeightedTrackKm)
			} catch (err) {
				logger.warn(`Could not convert weighted tracker logs to weighted track kilometers.`)
			}
		}

		// add weight to app logs
		const weightedAppLogs = this.addWeightToLogs(appLogs, lineStringData, 30, 15, true)
		if (weightedAppLogs.length === 0) {
			logger.warn(`Could not add any weights to app logs.`)
		} else {
			// try adding them to the list as well
			try {
				const tempWeightedTrackKm = this.weightedLogsToWeightedTrackKm(
					weightedAppLogs,
					vehicleSpeed,
					vehicleHeading,
					track
				)
				weightedTrackKm.push(...tempWeightedTrackKm)
			} catch (err) {
				logger.warn(`Could not convert weighted app logs to weighted track kilometers.`)
			}
		}

		// if we did not add any positions at all, we should return the last known position
		if (weightedTrackKm.length == 0) {
			logger.info(`Could not find any recent position while trying to compute vehicle's position.`)
			return GeoJSONUtils.parseGeoJSONFeaturePoint(trackerLogs[0].position)
		}

		// build average track kilometer value
		const avgTrackKm = this.averageWeightedTrackKmValues(weightedTrackKm)

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
	 * @throws `HTTPError`
	 * 	- if no weighted log is given
	 * 	- if track kilometer value could not be accessed from a log
	 * 	- if the travelling direction could not be computed
	 */
	private static weightedLogsToWeightedTrackKm(
		weightedLogs: [Log, number][],
		vehicleSpeed: number,
		vehicleHeading: number,
		track: Track
	): [number, number][] {
		// just need to check this for the next step
		if (weightedLogs.length === 0) {
			throw new HTTPError(`Expected at least one log for converting to track kilometer`, 500)
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
			let lastTrackKm
			try {
				lastTrackKm = this.getTrackKmFromLog(weightedLogs[i][0], track)
			} catch (err) {
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
	 * @returns track kilometer value for `log`
	 * @throws `HTTPError`
	 * 	- if the position of `log` could not be parsed
	 * 	- if the track kilometer value of the position of `log` could not be computed
	 */
	private static getTrackKmFromLog(log: Log, track: Track): number {
		// get position from log
		const logPosition = GeoJSONUtils.parseGeoJSONFeaturePoint(log.position)

		// compute track kilometer for this position
		return TrackService.getPointTrackKm(logPosition, track)
	}

	/**
	 * Add different factors to the weights of each Log
	 * @param logs list of `Log`s to add a weight to
	 * @param lineStringOfTrack GeoJSON linestring of geographical track data
	 * @param timeCutoff value to cut the time factor off at, default is 180 seconds (recommended for tracker logs)
	 * @param distanceCutoff value to cut the distance / accuracy factor off at, default is 50 meters (recommended for tracker logs)
	 * @param averaging flag to decide wether all Logs should be averaged via their related weight
	 * @returns list of `Log`s, each associated with a weight, could be less than count of `logs` (and even 0) if an error occurs
	 * @throws `HTTPError`, if a log position could not be parsed
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
			let logPosition
			try {
				logPosition = GeoJSONUtils.parseGeoJSONFeaturePoint(logs[i].position)
			} catch (err) {
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
	 * @returns averaged track kilometer value of `weightedTrackKms`
	 * @throws `HTTPError`
	 * 	- if there is a negative weight
	 * 	- if there was no weight greater than 0
	 */
	private static averageWeightedTrackKmValues(weightedTrackKms: [number, number][]): number {
		// calculate total of all weights
		let weightSum = 0
		for (let i = 0; i < weightedTrackKms.length; i++) {
			// check if weight is negative (this could result in unwanted behaviour)
			if (weightedTrackKms[i][1] < 0) {
				throw new HTTPError(
					`Expected positive weights for track kilometer values only, but got ${weightedTrackKms[i][1]}.`,
					500
				)
			}

			weightSum += weightedTrackKms[i][1]
		}

		// avoid divide by zero
		if (weightSum == 0) {
			throw new HTTPError(
				`Expected at least one weight to be greater than 0 while computing average track kilometer.`,
				500
			)
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
	 * @param trackKm track kilometer at which the vehicle currently is (can be found with `VehicleService.getVehicleTrackDistanceKm`)
	 * @param vehicleHeading heading of vehicle (0-359), can be obtained with `getVehicleHeading`
	 * @param track track to compute the direction of a vehicle with
	 * @returns 1 or -1 if the vehicle is heading towards the end and start of the track respectively
	 * @throws `HTTPError`, if the heading of the track at `trackKm` could not be computed
	 */
	private static computeVehicleTravellingDirection(trackKm: number, vehicleHeading: number, track: Track): 1 | -1 {
		// TODO: needs improvements (probably with #118 together), should be independent from track kilometer (position needs to be computed for that)
		// compute track heading
		const trackBearing = TrackService.getTrackHeading(track, trackKm)
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
