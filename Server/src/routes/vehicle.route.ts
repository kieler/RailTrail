import { Request, Response, Router } from "express"
import { GetUidApp, ReturnUidApp, UpdateRequestApp, UpdateResponseApp, VehicleApp } from "../models/api.app"
import { Position, UpdateVehicle, Vehicle as APIVehicle } from "../models/api"
import { logger } from "../utils/logger"
import { authenticateJWT, jsonParser } from "."
import { Log, Track, Tracker, Vehicle, VehicleType } from "@prisma/client"
import VehicleService from "../services/vehicle.service"
import { Feature, Point } from "geojson"
import please_dont_crash from "../utils/please_dont_crash"
import database from "../services/database.service"
import GeoJSONUtils from "../utils/geojsonUtils"
import TrackService from "../services/track.service"
import { z } from "zod"

/**
 * The router class for the routing of the vehicle data to app and website.
 */
export class VehicleRoute {
	/** The path of this api route. */
	public static path: string = "/vehicles" // TODO: rename to vehicle when app is ready
	/** The sub router instance. */
	private static instance: VehicleRoute
	/** The base router object. */
	private router = Router()

	/**
	 * The constructor to connect all of the routes with specific functions.
	 */
	private constructor() {
		this.router.put("/app/getId", jsonParser, please_dont_crash(this.getUid))
		this.router.put("/app", jsonParser, please_dont_crash(this.updateVehicleApp))

		this.router.get("/", authenticateJWT, please_dont_crash(this.getAllVehicles))
		this.router.get("/:vehicleId", authenticateJWT, please_dont_crash(this.getVehicleById))
		this.router.post("/", authenticateJWT, jsonParser, please_dont_crash(this.createVehicle))
		this.router.put("/:vehicleId", authenticateJWT, jsonParser, please_dont_crash(this.updateVehicle))
		this.router.delete("/:vehicleId", authenticateJWT, please_dont_crash(this.deleteVehicle))
	}

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!VehicleRoute.instance) {
			VehicleRoute.instance = new VehicleRoute()
		}
		return VehicleRoute.instance.router
	}

	/**
	 * Map the vehicle name to the uid of the backend.
	 *
	 * @param req A request containing a `GetUidApp` with a vehicle name in the request body and a track id in the parameters
	 * to determine the vehicle.
	 * @param res The vehicles uid in a `ReturnUidApp`.
	 * @returns Nothing
	 */
	private async getUid(req: Request, res: Response): Promise<void> {
		const userDataPayload = GetUidApp.safeParse(req.body)
		if (!userDataPayload.success) {
			logger.error(userDataPayload.error)
			res.sendStatus(400)
			return
		}
		const userData = userDataPayload.data

		const track: Track | null = await database.tracks.getById(userData.trackId)
		if (!track) {
			logger.error(`Could not find track with id ${userData.trackId}`)
			res.sendStatus(404)
			return
		}

		const vehicle: Vehicle | null = await database.vehicles.getByName(userData.vehicleName, track.uid)
		if (!vehicle) {
			res.sendStatus(404)
			return
		}

		const ret: z.infer<typeof ReturnUidApp> = { vehicleId: vehicle.uid }
		res.json(ret)
		return
	}

	/**
	 * Updates location of app and gets some present information for the app. (vehicles near user etc.)
	 * @param req An UpdateRequestWithLocationEnabled in the body.
	 * @param res An UpdateResponseWithLocationEnabled with the useful information.
	 * @returns Nothing.
	 */
	private async updateVehicleApp(req: Request, res: Response): Promise<void> {
		const userDataPayload = UpdateRequestApp.safeParse(req.body)
		if (!userDataPayload.success) {
			logger.error(userDataPayload.error)
			res.sendStatus(400)
			return
		}
		const userData = userDataPayload.data

		const userVehicle: Vehicle | null = await database.vehicles.getById(userData.vehicleId)
		if (!userVehicle) {
			logger.error(`Could not find vehicle with id ${userData.vehicleId}`)
			res.sendStatus(404)
			return
		}

		if (userData.pos && userData.heading && userData.speed && userData.timestamp) {
			const log: Log | null = await VehicleService.appendLog(
				userVehicle.uid,
				userData.timestamp,
				userData.pos,
				userData.heading,
				userData.speed
			)
			if (!log) {
				logger.warn(`Could not append log for user vehicle with id ${userVehicle.uid}`)
			}
		}

		const heading: number = await VehicleService.getVehicleHeading(userVehicle)
		const speed: number = await VehicleService.getVehicleSpeed(userVehicle)
		const pos: Feature<Point> | null = await VehicleService.getVehiclePosition(userVehicle, heading, speed)
		if (!pos) {
			logger.error(`Could not find position of vehicle with id ${userVehicle.uid}`)
			res.sendStatus(404)
			return
		}
		const position: z.infer<typeof Position> = {
			lat: GeoJSONUtils.getLatitude(pos),
			lng: GeoJSONUtils.getLongitude(pos)
		}
		const track: Track | null = await database.tracks.getById(userVehicle.trackId)
		if (!track) {
			logger.error(`Could not find track with id ${userVehicle.trackId}
			 obtained from the user vehicle with id ${userVehicle.uid}`)
			res.sendStatus(500)
			return
		}
		const userVehicleTrackKm: number | null = GeoJSONUtils.getTrackKm(pos)
		if (userVehicleTrackKm == null) {
			logger.error(`Could not compute track kilometer for vehicle with id ${userVehicle.uid} 
			 at track wit id ${userVehicle.trackId}`)
			res.sendStatus(500)
			return
		}
		const userVehicleSimplifiedHeading: number = await VehicleService.getVehicleTrackHeading(
			userVehicle,
			userVehicleTrackKm,
			heading
		)

		const allVehiclesOnTrack: Vehicle[] | null = await database.vehicles.getAll(userVehicle.trackId)
		if (allVehiclesOnTrack == null) {
			res.sendStatus(500)
			return
		}

		const appVehiclesNearUser: z.infer<typeof VehicleApp>[] = (
			await Promise.all(
				allVehiclesOnTrack.map(async v => {
					const heading = await VehicleService.getVehicleHeading(v)
					const speed = await VehicleService.getVehicleSpeed(v)
					const pos = await VehicleService.getVehiclePosition(v, heading, speed)
					const trackers = await database.trackers.getByVehicleId(v.uid)
					const nearbyVehicleTrackKm: number | null = pos ? GeoJSONUtils.getTrackKm(pos) : null
					if (nearbyVehicleTrackKm == null) {
						logger.error(`Could not compute track kilometer for vehicle with id ${v.uid}
						 at track wit id ${v.trackId}`)
						return {
							id: v.uid,
							name: v.name,
							track: v.trackId,
							type: v.typeId,
							trackerIds: trackers.map(t => t.uid),
							pos: pos ? { lat: GeoJSONUtils.getLatitude(pos), lng: GeoJSONUtils.getLongitude(pos) } : undefined,
							percentagePosition: -1,
							heading: heading,
							headingTowardsUser: undefined
						}
					}
					const nearbySimplifiedVehicleHeading: number = await VehicleService.getVehicleTrackHeading(
						v,
						nearbyVehicleTrackKm,
						heading
					)
					return {
						id: v.uid,
						name: v.name,
						track: v.trackId,
						type: v.typeId,
						trackerIds: trackers.map(t => t.uid),
						pos: pos ? { lat: GeoJSONUtils.getLatitude(pos), lng: GeoJSONUtils.getLongitude(pos) } : undefined,
						percentagePosition: (await TrackService.getTrackKmAsPercentage(nearbyVehicleTrackKm, track)) ?? -1,
						heading: heading,
						headingTowardsUser:
							userVehicleSimplifiedHeading !== 0 && nearbySimplifiedVehicleHeading !== 0
								? nearbySimplifiedVehicleHeading != userVehicleSimplifiedHeading
								: undefined
					}
				})
			)
		).filter(v => v.id !== userVehicle.uid && v.track === track.uid && v.percentagePosition !== -1)

		const percentagePositionOnTrack: number | null = await TrackService.getTrackKmAsPercentage(
			userVehicleTrackKm,
			track
		)
		if (percentagePositionOnTrack == null) {
			logger.error(`Could not determine percentage position on track for user with vehicle ${userVehicle.uid}`)
			res.sendStatus(500)
			return
		}
		const ret: z.infer<typeof UpdateResponseApp> = {
			pos: position,
			heading: heading,
			vehiclesNearUser: appVehiclesNearUser,
			speed: speed,
			percentagePositionOnTrack: percentagePositionOnTrack,
			passingPosition: undefined // TODO: Find out passingPosition
		}
		res.json(ret)
		return
	}

	/**
	 * Get a list of vehicles with all the required properties for CRUD operations
	 * @param _req A request containing a track id in the parameters
	 * @param res A list of `VehicleListItemWebsite`.
	 * @returns Nothing
	 */
	private async getAllVehicles(_req: Request, res: Response): Promise<void> {
		const vehicles = await database.vehicles.getAll()
		const apiVehicles: z.infer<typeof APIVehicle>[] = await Promise.all(
			vehicles.map(async vehicle => {
				const tracker = await database.trackers.getByVehicleId(vehicle.uid)
				const apiVehicle: z.infer<typeof APIVehicle> = {
					id: vehicle.uid,
					name: vehicle.name,
					type: vehicle.typeId,
					trackerIds: tracker.map(tracker => tracker.uid),
					track: vehicle.trackId
				}
				return apiVehicle
			})
		)

		if (!apiVehicles) {
			res.sendStatus(500)
			return
		}

		res.json(apiVehicles)
		return
	}

	private async getVehicleById(req: Request, res: Response): Promise<void> {
		const vehicleId = Number.parseInt(req.params.vehicleId)
		if (!Number.isFinite(vehicleId)) {
			res.sendStatus(400)
			return
		}

		const vehicle: Vehicle | null = await database.vehicles.getById(vehicleId)
		if (!vehicle) {
			res.sendStatus(404)
			return
		}
		const trackers: Tracker[] = await database.trackers.getByVehicleId(vehicleId)

		const apiVehicle: z.infer<typeof APIVehicle> = {
			id: vehicle.uid,
			name: vehicle.name,
			type: vehicle.typeId,
			trackerIds: trackers.map(tracker => tracker.uid),
			track: vehicle.trackId
		}
		res.json(apiVehicle)
		return
	}

	private async createVehicle(req: Request, res: Response) {
		const userDataPayload = UpdateVehicle.safeParse(req.body)
		if (!userDataPayload.success) {
			logger.error(userDataPayload.error)
			res.sendStatus(400)
			return
		}
		const userData = userDataPayload.data

		const type: VehicleType | null = await database.vehicles.getTypeById(userData.type)
		if (!type) {
			logger.error(`Could not find vehicle type with id ${userData.type}`)
			res.sendStatus(404)
			return
		}

		const track: Track | null = await database.tracks.getById(userData.track)
		if (!track) {
			logger.error(`Could not find track with id ${userData.track}`)
			res.sendStatus(404)
			return
		}

		const trackers: Tracker[] = []
		for (const trackerId of userData.trackerIds) {
			const maybeTracker: Tracker | null = await database.trackers.getById(trackerId)
			if (!maybeTracker) {
				logger.error(`Could not find tracker with id ${trackerId}`)
				res.sendStatus(404)
				return
			}
			trackers.push(maybeTracker)
		}

		const vehicle: Vehicle | null = await database.vehicles.save({
			name: userData.name,
			typeId: type.uid,
			trackId: userData.track
		})
		if (!vehicle) {
			logger.error(`Could not create vehicle`)
			res.sendStatus(500)
			return
		}

		for (const tracker of trackers) {
			const updatedTracker = await database.trackers.update(tracker.uid, { vehicleId: vehicle.uid })
			if (!updatedTracker) {
				logger.error(`Could not attach tracker to created vehicle.`)
				res.sendStatus(500)
				return
			}
		}

		res.status(201).json(vehicle.uid)
		return
	}

	/**
	 * Updates or creates a vehicle of the database.
	 * @param req A request containing a `VehicleCrUWebsite`.
	 * @param res
	 * @returns Nothing
	 */
	private async updateVehicle(req: Request, res: Response): Promise<void> {
		const vehicleId: number = Number.parseInt(req.params.vehicleId)

		// check if both are numbers, and not NaN or infinity
		if (!Number.isFinite(vehicleId)) {
			if (logger.isSillyEnabled())
				logger.silly(`Update for ${req.params.vehicleId} on ${req.params.trackId} failed. Not a number`)
			res.sendStatus(400)
			return
		}

		const userDataPayload = UpdateVehicle.safeParse(req.body)
		if (!userDataPayload.success) {
			logger.error(userDataPayload.error)
			res.sendStatus(400)
			return
		}
		const userData = userDataPayload.data

		const vehicleToUpdate: Vehicle | null = await database.vehicles.getById(vehicleId)
		if (!vehicleToUpdate) {
			logger.error(`Could not find vehicle to update with id ${vehicleId}`)
			res.sendStatus(404)
			return
		}

		const type: VehicleType | null = await database.vehicles.getTypeById(userData.type)
		if (!type) {
			logger.error(`Could not find vehicle type with id ${userData.type}`)
			res.sendStatus(404)
			return
		}

		const track: Track | null = await database.tracks.getById(userData.track)
		if (!track) {
			logger.error(`Could not find track with id ${userData.track}`)
			res.sendStatus(404)
			return
		}

		const conflict = await database.vehicles.getByName(userData.name, userData.track)
		if (conflict && conflict.uid !== vehicleId) {
			res.sendStatus(409)
			return
		}

		const prevTrackers: Tracker[] = await database.trackers.getByVehicleId(vehicleId)

		const trackers: Tracker[] = []
		for (const trackerId of userData.trackerIds) {
			const tracker: Tracker | null = await database.trackers.getById(trackerId)
			if (!tracker) {
				logger.error(`Could not find tracker with id ${trackerId}`)
				res.sendStatus(404)
				return
			}
			trackers.push(tracker)
		}

		const vehicle = await database.vehicles.update(vehicleId, {
			typeId: type.uid,
			trackId: userData.track,
			name: userData.name
		})
		if (!vehicle) {
			logger.error(`Could not update vehicle with id ${vehicleId}`)
			res.sendStatus(500)
			return
		}

		for (const tracker of prevTrackers) {
			database.trackers.update(tracker.uid, { vehicleId: null })
		}

		for (const tracker of trackers) {
			const trackerToUpdate: Tracker | null = await database.trackers.update(tracker.uid, { vehicleId: vehicleId })
			if (!trackerToUpdate) {
				logger.error(`Could not set tracker with tracker-id ${tracker}`)
				res.sendStatus(500)
				return
			}
		}

		res.sendStatus(200)
		return
	}

	/**
	 * Delete a vehicle with a specific uid from the database.
	 * @param req A request containing a vehicle uid.
	 * @param res
	 * @returns Nothing
	 */
	private async deleteVehicle(req: Request, res: Response): Promise<void> {
		const vehicleId: number = Number.parseInt(req.params.vehicleId)

		// check if both are numbers, and not NaN or infinity
		if (!Number.isFinite(vehicleId)) {
			if (logger.isSillyEnabled()) logger.silly(`Delete for ${req.params.vehicleId} failed. Not a number`)
			res.sendStatus(400)
			return
		}

		const vehicle: Vehicle | null = await database.vehicles.getById(vehicleId)
		if (!vehicle) {
			logger.error(`Could not find vehicle with id ${vehicleId}`)
			res.sendStatus(404)
			return
		}

		const success: boolean = await database.vehicles.remove(vehicleId)
		if (!success) {
			logger.error(`Could not delete vehicle with id ${vehicleId}`)
			res.sendStatus(500)
			return
		}

		res.sendStatus(200)
		return
	}
}
