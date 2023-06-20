import { Router, Request, Response } from "express";
import { authenticateJWT, jsonParser, v } from ".";
import { TrackMetaDataWebsite, TrackMetaDataResponseWebsite, TrackPathWebsite } from "../models/api.website";
import { TrackMetaDataSchemaWebsite, TrackPathSchemaWebsite } from "../models/jsonschemas.website";

/**
 * The router class for the routing of the track uploads from the website.
 */
export class TrackUploadRoute {
    /** The path of this api route. */
    public static path: string = '/trackupload';
    /** The sub router instance. */
    private static instance: TrackUploadRoute;
    /** The base router object. */
    private router = Router();

    /**
     * The constructor to connect all of the routes with specific functions. 
     */
    private constructor() {
        this.router.get('/website', authenticateJWT, jsonParser, this.getUploadId)
        this.router.post('/website', authenticateJWT, jsonParser, this.uploadData)
    }

    /**
     * Creates an instance if there is none yet.
     */
    static get router() {
        if (!TrackUploadRoute.instance) {
            TrackUploadRoute.instance = new TrackUploadRoute();
        }
        return TrackUploadRoute.instance.router;
    }

    /**
     * Gets an id to upload data to. This might be deleted later in case we realise, the geojson can be sent directly.
     * @param req The request containing some track meta data such as the track name.
     * @param res A TrackMetaDataResponse that contains an upload id.
     * @returns Nothing.
     */
    private getUploadId = async (req: Request, res: Response) => {
        const userData: TrackMetaDataWebsite = req.body

        if (!userData //|| !v.validate(userData, TrackMetaDataSchema).valid
        ) {
            // FIXME: Add service method
        }

        const ret: TrackMetaDataResponseWebsite = {
            uploadId: 12
        }
        res.json(ret)
        return
    }

    /**
     * Upload a geojson file to the backend. 
     * @param req A request containing a geojson with the path.
     * @param res Just a status code.
     * @returns Nothing.
     */
    private uploadData = async (req: Request, res: Response) => {
        const userData: TrackPathWebsite = req.body
        if (!userData //|| !v.validate(userData, TrackPathSchema)
        ) {
            // FIXME: Add service method
        }

        res.sendStatus(200)
        return
    }
}
