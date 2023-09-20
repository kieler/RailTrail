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
	 * Append log for a given vehicle
	 * @param vehicleId vehicle id to append the log for
	 * @param position position of the vehicle
	 * @param heading heading of the vehicle
	 * @param speed speed of the vehicle
   * @param timestamp timestamp of the gps position
	 * @returns appended log if successful
	 * @throws PrismaError, if appending log in the database was not possible
	 */
	public static async appendLog(
		vehicleId: number,
		position: z.infer<typeof Position>,
		heading: number,
		speed: number,
		timestamp: Date
	): Promise<Log> {
		return await database.logs.save({
			timestamp,
			vehicleId,
			position: [position.lng, position.lat],
			heading,
			speed
		})
	}

	/**
	 * Compute all data (e.g. position, speed and heading) for a given vehicle
	 * @param vehicle `Vehicle` to compute data for
	 * @returns current `VehicleData` of `vehicle`, if no recent logs from an app are available `direction`, `trackKm`
	 * and `percentagePosition` are not set and `heading` and `speed` are just from the tracker, also `position` is not
	 * mapped on the track
	 * @throws `HTTPError`
	 * 	- if the track kilometer value of the position could not be accessed
	 * 	- if the position of the vehicle as percentage on the track could not be computed
	 * 	- if the travelling direction could not be computed
	 * @throws PrismaError
	 * 	- if the track of `vehicle` could not be accessed in the database
	 * 	- if no latest log of `vehicle` can be found in the database
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

		// initialize logs for apps and sampling them down, so we have logs with 2-3 seconds in between them
		// (randomized for better sampling) starting with the most recent log
		let lastLogTime = Date.now() + 3000
		const appLogs = (await database.logs.getNewestLogs(vehicle.uid, 30, null)).filter(function (log) {
			if (lastLogTime - log.timestamp.getTime() > 2000 + Math.random() * 1000) {
				lastLogTime = log.timestamp.getTime()
				return true
			}
			return false
		})

		// converting logs to pairs of log and related track kilometer
		// (reduces redundancy of calculating the track kilometer from a log)
		let appLogsTrackKm: [Log, number][]
		let trackerLogsTrackKm: [Log, number][]
		try {
			appLogsTrackKm = this.logsToLogsWithTrackKm(appLogs, track)
			trackerLogsTrackKm = this.logsToLogsWithTrackKm(trackerLogs, track)
		} catch (err) {
			// fallback
			return this.getLastKnownVehicleData(vehicle, track)
		}

		// check if we have any logs and otherwise get the latest vehicle data as a fallback
		if (appLogsTrackKm.length === 0 && trackerLogsTrackKm.length === 0) {
			return this.getLastKnownVehicleData(vehicle, track)
		}

		// get heading, speed and the position
		const heading = this.computeVehicleHeading(appLogsTrackKm.concat(trackerLogsTrackKm))
		const speed = this.computeVehicleSpeed(appLogsTrackKm.concat(trackerLogsTrackKm))
		let position: GeoJSON.Feature<GeoJSON.Point>
		try {
			position = this.computeVehiclePosition(trackerLogsTrackKm, appLogsTrackKm, heading, speed, track)
		} catch (err) {
			// fallback
			if (err instanceof HTTPError) {
				logger.warn(`Computation of position of vehicle ${vehicle.uid} resulted in an error: ${err.message}`)
			} else {
				logger.error(`Unexpected error: ${JSON.stringify(err)}`)
			}
			return this.getLastKnownVehicleData(vehicle, track)
		}

		// try to compute track kilometer
		let trackKm: number
		try {
			trackKm = GeoJSONUtils.getTrackKm(position)
		} catch (err) {
			// fallback that may work
			logger.info(`Track kilometer of position of vehicle ${vehicle.uid} was not accessible, trying to compute it now.`)
			trackKm = TrackService.getPointTrackKm(position, track)
		}

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
	 * @param vehicleSpeed speed of vehicle (>= 0), can be obtained with `getVehicleSpeed`
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
		trackerLogs: [Log, number][],
		appLogs: [Log, number][],
		vehicleHeading: number,
		vehicleSpeed: number,
		track: Track
	): GeoJSON.Feature<GeoJSON.Point> {
		const lineStringData = TrackService.getTrackAsLineString(track)
		// list of all resulting track kilometers
		const weightedTrackKm: [number, number][] = []

		if (trackerLogs.length !== 0) {
			// add a weight to the tracker logs
			const weightedTrackerLogs = this.addWeightToLogs(trackerLogs, lineStringData)

			// convert weighted tracker logs to weighted track kilometers (by projecting positions onto the track)
			if (weightedTrackerLogs.length === 0) {
				// now it is unlikely, that weights can be added to the app logs, but we could at least try it
				logger.warn(`Could not add any weights to tracker logs.`)
			} else {
				try {
					const tempWeightedTrackKm = this.weightedLogsToWeightedTrackKm(
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
		}

		if (appLogs.length !== 0) {
			// add weight to app logs
			const weightedAppLogs = this.addWeightToLogs(appLogs, lineStringData, 30, 15)
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
		}

		// if we did not add any positions at all, we should return the last known position
		if (weightedTrackKm.length == 0) {
			throw new HTTPError(`Could not find any recent position while trying to compute vehicle's position.`, 500)
		}

		// build average track kilometer value
		// TODO: try catch?
		const avgTrackKm = this.averageWeightedTrackKmValues(weightedTrackKm)

		// in the end we just need to turn the track kilometer into a position again
		const avgPosition = along(lineStringData, avgTrackKm)
		GeoJSONUtils.setTrackKm(avgPosition, avgTrackKm)
		return avgPosition
	}

	/**
	 * Convert list of weighted logs to list of weighted (current / predicted) track kilometer values
	 * @param weightedLogs list of weighted logs (including their track kilometer) to be converted, all need to be from the same vehicle
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
		weightedLogs: [Log, number, number][],
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

			// get travelling direction
			// TODO: should be a parameter replacing vehicleHeading (function needs to be adjusted for that)
			const trackHeading = this.computeVehicleTravellingDirection(weightedLogs[i][1], vehicleHeading, track)

			// calculate the current track kilometer and add it to the list
			const timePassedSec = Date.now() / 1000 - weightedLogs[i][0].timestamp.getTime() / 1000
			const currentTrackKm = weightedLogs[i][1] + vehicleSpeed * (timePassedSec / 3600) * trackHeading
			weightedTrackKms.push([currentTrackKm, weightedLogs[i][2]])
		}
		return weightedTrackKms
	}

	/**
	 * Fallback function, if an error occured in the original computation
	 * @param vehicle `Vehicle` to get the last known data from
	 * @param track assigned `Track` of `vehicle`
	 * @returns unprocessed data of the latest log for `vehicle`
	 * @throws `HTTPError`
	 * 	- if the latest position could not be parsed
	 * 	- if the track kilometer of the latest position could not be calculated
	 * 	- if the track kilometer could not be converted to percentage for `track`
	 * 	- if the travelling direction of the vehicle could not be computed
	 * @throws PrismaError, if the latest log of `vehicle` could not be fetched from the database
	 */
	private static async getLastKnownVehicleData(vehicle: Vehicle, track: Track): Promise<VehicleData> {
		// get latest log, its position and track kilometer
		const latestLog = await database.logs.getLatestLog(vehicle.uid)
		const latestPosition = GeoJSONUtils.parseGeoJSONFeaturePoint(latestLog.position)
		const trackKm = TrackService.getPointTrackKm(latestPosition, track)

		// return result (raw data)
		return {
			vehicle,
			position: latestPosition,
			trackKm,
			percentagePosition: TrackService.getTrackKmAsPercentage(trackKm, track),
			heading: latestLog.heading,
			direction: this.computeVehicleTravellingDirection(trackKm, latestLog.heading, track),
			speed: latestLog.speed
		}
	}

	/**
	 * Add track kilometer to the related log
	 * @param logs logs to add the track kilometer to
	 * @param track `Track` assigned to the vehicle of which the logs are from
	 * @returns list of pairs of log and related track kilometer
	 * @throws `HTTPError`, if a track kilometer value could not be calculated from a log
	 */
	private static logsToLogsWithTrackKm(logs: Log[], track: Track): [Log, number][] {
		return logs.map(function (log) {
			return [log, VehicleService.getTrackKmFromLog(log, track)]
		})
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
	 * @param logs list of `Log`s and their related track kilometer to add a weight to
	 * @param lineStringOfTrack GeoJSON linestring of geographical track data
	 * @param timeCutoff value to cut the time factor off at, default is 180 seconds (recommended for tracker logs)
	 * @param distanceCutoff value to cut the distance / accuracy factor off at, default is 50 meters (recommended for tracker logs)
	 * @returns list of `Log`s, each associated with its track kilometer and a weight, could be less than count of `logs`
	 * (and even 0) if an error occurs
	 */
	private static addWeightToLogs(
		logs: [Log, number][],
		lineStringOfTrack: GeoJSON.Feature<GeoJSON.LineString>,
		timeCutoff = 180,
		distanceCutoff = 50
	): [Log, number, number][] {
		// resulting list
		const weightedLogs: [Log, number, number][] = []

		for (let i = 0; i < logs.length; i++) {
			// compute time factor (linear)
			const timePassedSec = Date.now() / 1000 - logs[i][0].timestamp.getTime() / 1000
			let timeWeight = (timeCutoff - timePassedSec) / timeCutoff
			timeWeight = timeWeight > 0 ? timeWeight : 0

			// get position from log
			let logPosition
			try {
				logPosition = GeoJSONUtils.parseGeoJSONFeaturePoint(logs[i][0].position)
			} catch (err) {
				logger.warn(`Position ${JSON.stringify(logs[i][0].position)} could not be parsed.`)
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
			weightedLogs.push([logs[i][0], logs[i][1], timeWeight * accuracy])
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
		// initialize app logs and track
		const appLogs = (await database.logs.getNewestLogs(vehicle.uid, 30)).filter(function (log) {
			return log.trackerId == null
		})
		const track = await database.tracks.getById(vehicle.trackId)

		// convert app logs and compute heading
		const appLogsTrackKm = this.logsToLogsWithTrackKm(appLogs, track)
		return this.computeVehicleHeading(appLogsTrackKm)
	}

	/**
	 * Compute average heading of given tracker logs
	 * @param logs logs to get the average heading from
	 * @returns average heading (between 0 and 359) of `logs`
	 */
	private static computeVehicleHeading(logs: [Log, number][]): number {
		// TODO: needs to be improved (see #118)
		let avgHeading = 0
		for (let i = 0; i < logs.length; i++) {
			avgHeading += logs[i][0].heading / logs.length
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
		// initialize app logs and track
		const appLogs = (await database.logs.getNewestLogs(vehicle.uid, 30)).filter(function (log) {
			return log.trackerId == null
		})
		const track = await database.tracks.getById(vehicle.trackId)

		// convert app logs and compute speed
		const appLogsTrackKm = this.logsToLogsWithTrackKm(appLogs, track)
		return this.computeVehicleSpeed(appLogsTrackKm)
	}

	/**
	 * Compute average speed of given logs
	 * @param logs logs to get the average speed from
	 * @returns average speed of `logs`
	 */
	private static computeVehicleSpeed(logs: [Log, number][]): number {
		// TODO: needs improvement (see #132)
		let avgSpeed = 0
		for (let i = 0; i < logs.length; i++) {
			avgSpeed += logs[i][0].speed / logs.length
		}
		return avgSpeed
	}
}
