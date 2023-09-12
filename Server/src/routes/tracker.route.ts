import { Request, Response, Router } from "express"
import { logger } from "../utils/logger"
import { authenticateJWT, jsonParser } from "."
import TrackerService from "../services/tracker.service"
import { UplinkTracker } from "../models/api.tracker"
import please_dont_crash from "../utils/please_dont_crash"
import { Log, Prisma, Tracker, Vehicle } from "@prisma/client"
import database from "../services/database.service"
import { Tracker as APITracker } from "../models/api"
import { z } from "zod"

/**
 * The router class for the tracker managment and the upload of new tracker positions.
 */
export class TrackerRoute {
	/** The path of this api route. */
	public static path: string = "/tracker"
	/** The sub router instance. */
	private static instance: TrackerRoute
	/** The base router object. */
	private router = Router()

	/**
	 * The constructor to connect all of the routes with specific functions.
	 */
	private constructor() {
		this.router.get("/", authenticateJWT, please_dont_crash(this.getAllTracker))
		this.router.get("/:trackerId", authenticateJWT, please_dont_crash(this.getTracker))
		this.router.post("/", authenticateJWT, jsonParser, please_dont_crash(this.createTracker))
		this.router.put("/:trackerId", authenticateJWT, jsonParser, please_dont_crash(this.updateTracker))
		this.router.delete("/:trackerId", authenticateJWT, please_dont_crash(this.deleteTracker))

		/* Here are the specific endpoints for the tracker to upload new positions */
		this.router.post("/oyster/lorawan", jsonParser, please_dont_crash(this.oysterLorawanUplink))
	}

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!TrackerRoute.instance) {
			TrackerRoute.instance = new TrackerRoute()
		}
		return TrackerRoute.instance.router
	}

	private async getAllTracker(_req: Request, res: Response): Promise<void> {
		const trackers: Tracker[] = await database.trackers.getAll()

		const apiTrackers: z.infer<typeof APITracker>[] = trackers.map(({ uid, data, vehicleId }) => {
			const tracker: z.infer<typeof APITracker> = {
				id: uid,
				vehicleId: vehicleId,
				data: data ?? undefined
			}
			return tracker
		})

		res.json(apiTrackers)
		return
	}

	private async getTracker(req: Request, res: Response): Promise<void> {
		const trackerId: string = req.params.trackerId

		const tracker: Tracker | null = await database.trackers.getById(trackerId)
		if (!tracker) {
			if (logger.isSillyEnabled()) logger.silly(`Request for tracker ${trackerId} failed. Not found`)
			res.sendStatus(404)
			return
		}

		const [lastLog]: [lastLog?: Log, ...rest: never[]] = await database.logs.getAll(undefined, tracker.uid, 1)

		const apiTracker: z.infer<typeof APITracker> = {
			id: tracker.uid,
			vehicleId: tracker.vehicleId,
			battery: lastLog?.battery ?? undefined,
			data: tracker.data ?? undefined
		}

		res.json(apiTracker)
		return
	}

	private async createTracker(req: Request, res: Response): Promise<void> {
		const apiTrackerPayload = APITracker.safeParse(req.body)
		if (!apiTrackerPayload.success) {
			logger.http(apiTrackerPayload.error)
			res.sendStatus(400)
			return
		}
		const apiTracker = apiTrackerPayload.data

		const tracker: Tracker | null = await database.trackers.save({
			uid: apiTracker.id,
			vehicleId: apiTracker.vehicleId,
			data: apiTracker.data as Prisma.InputJsonValue
		})
		if (!tracker) {
			logger.error("Could not create tracker")
			res.sendStatus(500)
			return
		}

		const responseTracker: z.infer<typeof APITracker> = {
			id: tracker.uid,
			vehicleId: tracker.vehicleId,
			data: tracker.data ?? undefined
		}
		res.status(201).json(responseTracker)
		return
	}

	private async updateTracker(req: Request, res: Response): Promise<void> {
		const trackerId: string = req.params.trackerId

		const userDataPayload = APITracker.safeParse(req.body)
		if (!userDataPayload.success) {
			logger.http(userDataPayload.error)
			res.sendStatus(400)
			return
		}
		const userData = userDataPayload.data

		if (userData.id !== trackerId) {
			res.sendStatus(400)
			return
		}

		let tracker: Tracker | null = await database.trackers.getById(trackerId)
		if (!tracker) {
			logger.error(`Could not find tracker with id ${trackerId}`)
			res.sendStatus(404)
			return
		}

		tracker = await database.trackers.update(trackerId, {
			vehicleId: userData.vehicleId,
			data: userData.data as Prisma.InputJsonValue
		})
		if (!tracker) {
			logger.error(`Could not update tracker with id ${userData.id}`)
			res.sendStatus(500)
			return
		}

		res.sendStatus(200)
		return
	}

	private async deleteTracker(req: Request, res: Response): Promise<void> {
		const trackerId: string = req.params.trackerId

		const success: boolean = await database.trackers.remove(trackerId)
		if (!success) {
			logger.error(`Could not delete tracker with id ${trackerId}`)
			res.sendStatus(500)
			return
		}

		res.sendStatus(200)
		return
	}

	/* Here are the specific endpoints for the trackers to upload new positions */

	private oysterLorawanUplink = async (req: Request, res: Response) => {
		const trackerDataPayload = UplinkTracker.safeParse(req.body)
		if (!trackerDataPayload.success) {
			logger.http(trackerDataPayload.error)
			res.sendStatus(400)
			return
		}
		const trackerData = trackerDataPayload.data

		if (trackerData.uplink_message?.f_port != 1) {
			logger.info(`Uplink port ${trackerData.uplink_message.f_port} not supported`)
			res.sendStatus(400)
			return
		}
		const trackerId = trackerData.end_device_ids.device_id
		// load the tracker from the database
		const tracker: Tracker | null = await database.trackers.getById(trackerId)
		if (!tracker) {
			logger.silly(`Tried to append log on unknown tracker with id ${trackerId}`)
			res.sendStatus(401)
			return
		}
		if (trackerData.uplink_message.decoded_payload.fixFailed) {
			logger.info(`Fix failed for tracker ${trackerData.end_device_ids.device_id}`)
			res.sendStatus(200)
			return
		}
		// and get the vehicle the tracker is attached to. If it has no associated vehicle, do nothing.
		const associatedVehicle: Vehicle | null = tracker.vehicleId
			? await database.vehicles.getById(tracker.vehicleId)
			: null
		if (!associatedVehicle) {
			logger.silly(`Got position from tracker ${trackerId} with no associated vehicle.`)
			res.sendStatus(200)
			return
		}
		const timestamp = new Date()
		const position = JSON.parse(
			JSON.stringify([
				trackerData.uplink_message.decoded_payload.longitudeDeg,
				trackerData.uplink_message?.decoded_payload?.latitudeDeg
			])
		)
		const heading = trackerData.uplink_message.decoded_payload.headingDeg
		const speed = trackerData.uplink_message.decoded_payload.speedKmph
		const battery = trackerData.uplink_message.decoded_payload.batV
		if (
			(await TrackerService.appendLog(
				associatedVehicle,
				timestamp,
				position,
				heading,
				speed,
				trackerId,
				battery,
				req.body
			)) == null
		) {
			res.sendStatus(500)
			return
		}

		res.sendStatus(200)
		return
	}
}
