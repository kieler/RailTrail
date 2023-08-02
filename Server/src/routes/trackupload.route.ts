import { Router, Request, Response } from "express"
import { authenticateJWT, jsonParser, v } from "."
import { AddTrackRequest } from "../models/api.website"
import { TrackMetaDataSchemaWebsite, TrackPathSchemaWebsite } from "../models/jsonschemas.website"
import TrackService from "../services/track.service"
import { FeatureCollection, GeoJsonProperties, Point } from "geojson"
import { Track } from "@prisma/client"

/**
 * The router class for the routing of the track uploads from the website.
 */
export class TrackUploadRoute {
    /** The path of this api route. */
    public static path: string = '/trackupload'
    /** The sub router instance. */
    private static instance: TrackUploadRoute
    /** The base router object. */
    private router = Router()

    /**
     * The constructor to connect all of the routes with specific functions. 
     */
    private constructor() {
        this.router.post('/website', authenticateJWT, jsonParser, this.uploadData)
    }

    /**
     * Creates an instance if there is none yet.
     */
    static get router() {
        if (!TrackUploadRoute.instance) {
            TrackUploadRoute.instance = new TrackUploadRoute()
        }
        return TrackUploadRoute.instance.router
    }

    /**
     * Upload a geojson file to the backend. 
     * @param req A request containing a geojson with the path.
     * @param res Just a status code.
     * @returns Nothing.
     */
    private async uploadData(req: Request, res: Response): Promise<void> {
        const userData: AddTrackRequest = req.body
        if (!userData || !v.validate(userData, TrackPathSchemaWebsite)
        ) {
            res.sendStatus(400)
            return
        }
        const start: string = userData.start
        const stop: string = userData.end
        const ret: Track | null = await TrackService.createTrack(userData.path, start, stop)
        if (!ret) {
            res.sendStatus(500)
            return
        }
        res.sendStatus(200)
        return
    }
}
