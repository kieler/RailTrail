import { Router, Request, Response } from "express";
import { authenticateJWT, jsonParser, v } from ".";
import { UpdateAddPOI } from "../models/api.website";
import { PositionSchema, UpdateAddPOISchema } from "../models/jsonschemas.website";

export class PoiRoute {
    public static path: string = "/poi";
    private static instance: PoiRoute;
    private router = Router();

    private constructor() {
        this.router.post('/website', authenticateJWT, jsonParser, this.changePoi)
        this.router.delete('/website/:poiId', authenticateJWT, this.deletePoi)
    }

    static get router() {
        if (!PoiRoute.instance) {
            PoiRoute.instance = new PoiRoute();
        }
        return PoiRoute.instance.router;
    }

    private changePoi = async (req: Request, res: Response) => {
        const userData: UpdateAddPOI = req.body
        // TODO: Check if we have to do this in initialisation
        v.addSchema(PositionSchema, 'Position')
        if (!userData || !v.validate(userData, UpdateAddPOISchema).valid) {
            // FIXME: Add service call
        }

        res.json({ id: 1 });
        res.sendStatus(200)
        return
    }

    private deletePoi = async (req: Request, res: Response) => {
        const poiId: number = parseInt(req.params?.poiId);
        // FIXME: Add service call

        res.sendStatus(200)
        return
    }
}
