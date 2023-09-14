import { Request, Response, Router } from "express"
import { logger } from "../utils/logger"
import { authenticateJWT, jsonParser } from "."
import TrackerService from "../services/tracker.service"
import { LteRecordField0, LteRecordField6, UplinkLteTracker, UplinkTracker } from "../models/api.tracker"
import please_dont_crash from "../utils/please_dont_crash"
import { Prisma, Tracker, Vehicle } from "@prisma/client"
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
		this.router.post("/oyster/lte", jsonParser, please_dont_crash(this.oysterLteUplink))
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

		const tracker: Tracker = await database.trackers.getById(trackerId)

		const lastLog = await database.logs.getLatestLog(undefined, tracker.uid)

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
			logger.error(apiTrackerPayload.error)
			res.sendStatus(400)
			return
		}
		const apiTracker = apiTrackerPayload.data

		const tracker: Tracker = await database.trackers.save({
			uid: apiTracker.id,
			vehicleId: apiTracker.vehicleId,
			data: apiTracker.data as Prisma.InputJsonValue
		})

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
			logger.error(userDataPayload.error)
			res.sendStatus(400)
			return
		}
		const userData = userDataPayload.data

		if (userData.id !== trackerId) {
			res.sendStatus(400)
			return
		}

		await database.trackers.update(trackerId, {
			vehicleId: userData.vehicleId,
			data: userData.data as Prisma.InputJsonValue
		})

		res.sendStatus(200)
		return
	}

	private async deleteTracker(req: Request, res: Response): Promise<void> {
		const trackerId: string = req.params.trackerId

		await database.trackers.remove(trackerId)

		res.sendStatus(200)
		return
	}

	/* Here are the specific endpoints for the trackers to upload new positions */

	private async oysterLorawanUplink(req: Request, res: Response) {
		const trackerDataPayload = UplinkTracker.safeParse(req.body)
		if (!trackerDataPayload.success) {
			logger.error(trackerDataPayload.error)
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
		const tracker: Tracker = await database.trackers.getById(trackerId)
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
		const longitude = trackerData.uplink_message.decoded_payload.longitudeDeg
		const latitude = trackerData.uplink_message?.decoded_payload?.latitudeDeg
		const heading = trackerData.uplink_message.decoded_payload.headingDeg
		const speed = trackerData.uplink_message.decoded_payload.speedKmph
		const battery = trackerData.uplink_message.decoded_payload.batV
		await TrackerService.appendLog(
			associatedVehicle,
			timestamp,
			[longitude, latitude],
			heading,
			speed,
			trackerId,
			battery,
			req.body
		)

		res.sendStatus(200)
		return
	}

	private async oysterLteUplink(req: Request, res: Response) {
		const trackerDataPayload = UplinkLteTracker.safeParse(req.body)
		if (!trackerDataPayload.success) {
			logger.error(trackerDataPayload.error)
			res.sendStatus(400)
			return
		}
		const trackerData = trackerDataPayload.data
		// using IMEI to identify the tracker, ICCID would also be possible but when you switch SIM cards, it changes (IMEI is tied to the device)
		const trackerId: string = trackerData.IMEI

		const tracker: Tracker = await database.trackers.getById(trackerId)

		const associatedVehicle: Vehicle | null = tracker.vehicleId
			? await database.vehicles.getById(tracker.vehicleId)
			: null
		if (!associatedVehicle) {
			logger.silly(`Got position from tracker ${trackerId} with no associated vehicle.`)
			res.sendStatus(200)
			return
		}

		// an uplink payload can contain multiple records
		// they are probably sorted by sequence number
		// but let's ensure that before processing
		trackerData.Records.sort((a, b) => a.SeqNo - b.SeqNo)

		let longitude = 0.0
		let latitude = 0.0
		let heading = 0
		let speed = 0
		let field0Present = false

		let battery = undefined
		// let temperature = 0
		for (const record of trackerData.Records) {
			for (const field of record.Fields) {
				switch (field.FType) {
					case 0: {
						// gps, heading and speed
						const gpsField: z.infer<typeof LteRecordField0> = field // we know that it is a gps field
						field0Present = true
						longitude = gpsField.Long
						latitude = gpsField.Lat
						heading = gpsField.Head
						speed = gpsField.Spd
						break
					}
					case 6: {
						// analogue data (battery, temperature)
						const analogueField: z.infer<typeof LteRecordField6> = field
						battery = analogueField.AnalogueData["1"] / 1000 // TODO: find out if 1 is actually the battery
						// temperature = analogueField.AnalogueData["3"] / 100
						break
					}
				}
			}
		}
		if (!field0Present) {
			res.sendStatus(400)
			return
		}
		await TrackerService.appendLog(
			associatedVehicle,
			new Date(), // TODO: use payload timestamp
			[longitude, latitude],
			heading,
			speed,
			trackerId,
			battery, // TODO: verify if AnalogueData["1"] is actually battery voltage before inserting
			req.body
		)
		res.sendStatus(200)
		return
	}
}
