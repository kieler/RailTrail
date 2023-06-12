import { Request, Response, Router } from "express";
import { logger } from "../utils/logger";
import { authenticateJWT, jsonParser, v } from ".";
import { Oyster3Lorawan } from "../models/tracker/oyster3lorawan";


export class TrakerRoute {
    public static path: string = "/tracker";
    private static instance: TrakerRoute;
    private router = Router();

    private constructor() {
        this.router.post("/oyster-lorawan", jsonParser, this.oysterLorawan);
    }

    static get router() {
        if (!TrakerRoute.instance) {
            TrakerRoute.instance = new TrakerRoute();
        }
        return TrakerRoute.instance.router;
    }

    private oysterLorawan = async (req: Request, res: Response) => {
        const trackerData: Oyster3Lorawan = req.body;
        if (!trackerData) { //} || !v.validate(trackerData, Oyster3LorawanRequestSchema).valid) {
            res.sendStatus(400);
            return;
        }
        
        res.json(200);
        return;
    };
}
