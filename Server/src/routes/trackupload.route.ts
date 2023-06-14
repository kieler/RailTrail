import { Router, Request, Response } from "express";
import { authenticateJWT, jsonParser, v } from ".";
import { TrackMetaData, TrackMetaDataResponse, TrackPath } from "../models/api.website";
import { TrackMetaDataSchema, TrackPathSchema } from "../models/jsonschemas.website";

export class TrackUploadRoute {
    public static path: string = '/trackupload';
    private static instance: TrackUploadRoute;
    private router = Router();

    private constructor() {
        this.router.get('/website', authenticateJWT, jsonParser, this.getUploadId)
        this.router.post('/website', authenticateJWT, jsonParser, this.uploadData)
    }

    static get router() {
        if (!TrackUploadRoute.instance) {
            TrackUploadRoute.instance = new TrackUploadRoute();
        }
        return TrackUploadRoute.instance.router;
    }

    private getUploadId = async (req: Request, res: Response) => {
        const userData: TrackMetaData = req.body

        if (!userData //|| !v.validate(userData, TrackMetaDataSchema).valid
        ) {
            // FIXME: Add service method
        }

        const ret: TrackMetaDataResponse = {
            uploadId: 12
        }
        res.json(ret)
        return
    }

    private uploadData = async (req: Request, res: Response) => {
        const userData: TrackPath = req.body
        if (!userData //|| !v.validate(userData, TrackPathSchema)
        ) {
            // FIXME: Add service method
        }

        res.sendStatus(200)
    }


}
