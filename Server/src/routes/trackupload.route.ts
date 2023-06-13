import { Router, Request, Response } from "express";
import { authenticateJWT, jsonParser } from ".";
import { TrackMetaData, TrackMetaDataResponse, TrackPath } from "../models/api.website";

export class TrackUpload {
	public static path: string = '/trackupload';
	private static instance: TrackUpload;
	private router = Router();

	private constructor() {
        this.router.get('/website', authenticateJWT, jsonParser, this.getUploadId)
        this.router.post('/website', authenticateJWT, jsonParser, this.uploadData)
	}

	static get router() {
		if (!TrackUpload.instance) {
			TrackUpload.instance = new TrackUpload();
		}
		return TrackUpload.instance.router;
	}

    private getUploadId =async (req:Request, res: Response) => {
        const userData: TrackMetaData = req.body
        // TODO: Validate schema

        // FIXME: Add service method

        const ret: TrackMetaDataResponse = {
            uploadId: 12
        }
        res.json(ret)
        return
    }

    private uploadData =async (req:Request, res: Response) => {
        const userData: TrackPath = req.body
        // TODO: Validate schema

        // FIXME: Add service method
        res.sendStatus(200)
    }

    
}
