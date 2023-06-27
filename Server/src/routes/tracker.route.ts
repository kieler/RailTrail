import { Request, Response, Router } from "express";
import { logger } from "../utils/logger";
import { authenticateJWT, jsonParser, v } from ".";
import TrackerService from "../services/tracker.service"


export class TrackerRoute {
    public static path: string = "/tracker";
    private static instance: TrackerRoute;
    private router = Router();

    private constructor() {
        this.router.post("/oyster/lorawan", jsonParser, this.oysterLorawan);
    }

    static get router() {
        if (!TrackerRoute.instance) {
            TrackerRoute.instance = new TrackerRoute();
        }
        return TrackerRoute.instance.router;
    }

    private oysterLorawan = async (req: Request, res: Response) => {
        const trackerData = req.body;
        if (!trackerData) {
            res.sendStatus(400);
            return;
        }

        if(trackerData.uplink_message.decoded_payload.fixFailed == "true") {
            logger.info("Fix failed for tracker ${trackerData.end_device_ids.device_id}");

        } else {
            let trackerId = trackerData.end_device_ids.device_id;
            let timestamp = new Date(trackerData.received_at);
            let position = JSON.parse(JSON.stringify([trackerData.uplink_message.decoded_payload.longitudeDeg, trackerData.uplink_message.decoded_payload.latitudeDeg]));
            let heading = trackerData.uplink_message.decoded_payload.headingDeg;
            let speed = trackerData.uplink_message.decoded_payload.speedKmph;
            let battery = trackerData.uplink_message.decoded_payload.batV;
            switch (trackerData.uplink_message.f_port) {
                case 1:
                    TrackerService.appendLog(trackerId, timestamp, position, heading, speed, battery, trackerData);
                    break;
                case 30:
                    TrackerService.registerTracker(trackerId, trackerData);
                    break;
                default:
                    break;
            }
        }
        res.sendStatus(200);
        return;
    };
}
