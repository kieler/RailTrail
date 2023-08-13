import { Application, Request, Response, Router } from "express";
import { logger } from "../utils/logger";
import { authenticateJWT, jsonParser, v, validateSchema } from ".";
import TrackerService from "../services/tracker.service";
import { UplinkSchemaTracker } from "../models/jsonschemas.tracker";
import { UplinkTracker } from "../models/tracker";
import please_dont_crash from "../utils/please_dont_crash";
import {Tracker, Vehicle} from "@prisma/client";
import VehicleService from "../services/vehicle.service";
import database from "../services/database.service";
import { Tracker as APITracker} from "../models/api";


/**
 * The router class for the tracker managment and the upload of new tracker positions.
 */
export class TrackerRoute {
    /** The path of this api route. */
    public static path: string = "/tracker";
    /** The sub router instance. */
    private static instance: TrackerRoute;
     /** The base router object. */
    private router = Router();

    /**
     * The constructor to connect all of the routes with specific functions.
     */
    private constructor() {
        this.router.get("/", this.getAllTracker)
        this.router.get("/:trackerId", this.getTracker)
        this.router.post("/", authenticateJWT, jsonParser, this.createTracker)
        //this.router.put("/:trackerId", authenticateJWT, jsonParser, this.updateTracker)
        //this.router.delete("/:trackerId", authenticateJWT, this.deleteTracker)

        /* Here are the specific endpoints for the tracker to upload new positions */
        this.router.post("/oyster/lorawan", jsonParser, please_dont_crash(this.uplink));
    }

    /**
     * Creates an instance if there is none yet.
     */
    static get router() {
        if (!TrackerRoute.instance) {
            TrackerRoute.instance = new TrackerRoute();
        }
        return TrackerRoute.instance.router;
    }

    private async getAllTracker(req: Request, res: Response): Promise<void> {
        const trackers: Tracker[] = await database.trackers.getAll()

        const apiTrackers: APITracker[] = trackers.map(({uid, data, vehicleId}) => {
            const tracker: APITracker = {
                id: uid,
                data: data ?? undefined,
                vehicleId: vehicleId ?? undefined
            };
            return tracker
        })

        res.json(apiTrackers)
        return
    }

    private async getTracker(req: Request, res: Response): Promise<void> {
        const trackerId = req.params.trackerId

        const tracker: Tracker | null = await database.trackers.getById(trackerId)
        if (!tracker) {
            if (logger.isSillyEnabled())
                logger.silly(`Request for tracker ${trackerId} failed. Not found`)
            res.sendStatus(404)
            return
        }

        const apiTracker: APITracker = {
            id: tracker.uid,
            data: tracker.data ?? undefined,
            vehicleId: tracker.vehicleId ?? undefined
        }

        res.json(apiTracker)
        return
    }

    private async createTracker(req: Request, res: Response): Promise<void> {
        /* Currently not working because the json body parses is not working as intended? */
        const apiTracker: APITracker = req.body
        logger.info(JSON.stringify(req.body))

        const tracker: Tracker | null = await database.trackers.save(apiTracker.id, apiTracker.data, apiTracker.vehicleId)
        if (!tracker) {
            logger.error("Could not create tracker")
            res.sendStatus(500)
            return
        }
        
        const responseTracker: APITracker = {
            id: tracker.uid,
            data: tracker.data ?? undefined,
            vehicleId: tracker.vehicleId ?? undefined
        }
        res.status(201).json(responseTracker)
        res.status(500)
        return
    }

    /* --- OLD --- */

    private uplink = async (req: Request, res: Response) => {
        const trackerData: UplinkTracker = req.body;
        if (!validateSchema(trackerData, UplinkSchemaTracker)) {
			res.sendStatus(400)
			return;
		}
        if (trackerData.uplink_message?.f_port != 1) {
            logger.info(`Uplink port ${trackerData.uplink_message.f_port} not supported`);
            res.sendStatus(400);
            return;
        }
        let trackerId = trackerData.end_device_ids.device_id;
        if (trackerData.uplink_message.decoded_payload.fixFailed) {
            logger.info("Fix failed for tracker ${trackerData.end_device_ids.device_id}");
            if (await TrackerService.registerTracker(trackerId, undefined) == null) {
                res.sendStatus(500);
                return;
            }
            res.sendStatus(200);
            return;
        }
        // load the tracker from the database
        const tracker: Tracker | null = await TrackerService.getTrackerById(trackerId);
        if (!tracker) {
            res.sendStatus(500);
            return;
        }
        // and get the vehicle the tracker is attached to. If it has no associated vehicle, do nothing.
        const associatedVehicle : Vehicle | null = tracker.vehicleId ? await VehicleService.getVehicleById(tracker.vehicleId): null;
        if (!associatedVehicle) {
            logger.silly(`Got position from tracker ${trackerId} with no associated vehicle.`)
            res.sendStatus(200);
            return;
        }
        let timestamp = new Date(trackerData.received_at);
        let position = JSON.parse(JSON.stringify([trackerData.uplink_message.decoded_payload.longitudeDeg, trackerData.uplink_message?.decoded_payload?.latitudeDeg]));
        let heading = trackerData.uplink_message.decoded_payload.headingDeg;
        let speed = trackerData.uplink_message.decoded_payload.speedKmph;
        let battery = trackerData.uplink_message.decoded_payload.batV;
        if (await TrackerService.appendLog(associatedVehicle, timestamp, position, heading, speed, trackerId, battery, req.body) == null) {
            res.sendStatus(500);
            return;
        }
        
        res.sendStatus(200);
        return;
    };

}
