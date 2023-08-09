import { Request, Response, Router } from "express";
import { logger } from "../utils/logger";
import { authenticateJWT, jsonParser, v, validateSchema } from ".";
import TrackerService from "../services/tracker.service";
import { UplinkSchemaTracker } from "../models/jsonschemas.tracker";
import { UplinkTracker } from "../models/tracker";
import please_dont_crash from "../utils/please_dont_crash";


export class TrackerRoute {
    public static path: string = "/tracker";
    private static instance: TrackerRoute;
    private router = Router();

    private constructor() {
        this.router.post("/oyster/lorawan", jsonParser, please_dont_crash(this.uplink));
        this.router.get("/", please_dont_crash(this.getAllTrackers));
    }

    static get router() {
        if (!TrackerRoute.instance) {
            TrackerRoute.instance = new TrackerRoute();
        }
        return TrackerRoute.instance.router;
    }

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
        let timestamp = new Date(trackerData.received_at);
        let position = JSON.parse(JSON.stringify([trackerData.uplink_message.decoded_payload.longitudeDeg, trackerData.uplink_message?.decoded_payload?.latitudeDeg]));
        let heading = trackerData.uplink_message.decoded_payload.headingDeg;
        let speed = trackerData.uplink_message.decoded_payload.speedKmph;
        let battery = trackerData.uplink_message.decoded_payload.batV;
        if (await TrackerService.appendLog(trackerId, timestamp, position, heading, speed, battery, req.body) == null) {
            res.sendStatus(500);
            return;
        }
        
        res.sendStatus(200);
        return;
    };

    private async getAllTrackers(_req: Request, res: Response) {
        const trackers = await TrackerService.getAllTrackers()
        res.json(trackers.map(t => t.uid));
        return;
    }

}
