import {Router, Request, Response, NextFunction} from "express"
import {authenticateJWT, jsonParser, v} from "."
import {AddTrackRequest} from "../models/api.website"
import {TrackMetaDataSchemaWebsite, TrackPathSchemaWebsite} from "../models/jsonschemas.website"
import TrackService from "../services/track.service"
import {FeatureCollection, GeoJsonProperties, Point} from "geojson"
import {Track} from "@prisma/client"
import please_dont_crash from "../utils/please_dont_crash";
import {logger} from "../utils/logger";
import {BareTrack, FullTrack} from "../models/api";

/**
 * The router class for the routing of the track uploads from the website.
 */
export class TrackRoute {
    /** The path of this api route. */
    public static path: string = '/track'
    /** The sub router instance. */
    private static instance: TrackRoute
    /** The base router object. */
    private router = Router()

    /**
     * The constructor to connect all of the routes with specific functions.
     */
    private constructor() {
        this.router.post('/', authenticateJWT, jsonParser, this.uploadData)
        this.router.get('/', authenticateJWT, please_dont_crash(this.getAllTracks))
        this.router.get('/:trackId', authenticateJWT, extractTrackID, please_dont_crash(this.getTrackByID))
    }

    /**
     * Creates an instance if there is none yet.
     */
    static get router() {
        if (!TrackRoute.instance) {
            TrackRoute.instance = new TrackRoute()
        }
        return TrackRoute.instance.router
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

    /**
     * This function is used to get a list of all tracknames in the system together with their internal id.
     * @param req The api request.
     * @param res Will contain a list of TrackListEntries if successful.
     * @returns Nothing
     */
    private async getAllTracks(req: Request, res: Response): Promise<void> {
        const ret: BareTrack[] =
            (await TrackService.getAllTracks()).map((track: Track) => {
                const ret: BareTrack = {id: track.uid, name: track.start + '-' + track.stop}
                return ret
            })
        res.json(ret)
        return
    }

    private async getTrackByID(_req: Request, res: Response) {
        const track: Track | undefined = res.locals.track;

        if (!track) {
            logger.error(`Could not find track which should be provided by extractTrackId`)
            res.sendStatus(500)
            return
        }

        const path: GeoJSON.GeoJSON | null = await TrackService.getTrackAsLineString(track)
        const length = await TrackService.getTrackLength(track);
        // const pois = await POIService.getAllPOIsForTrack(track)
        // const apiPois = await this.getWebsitePoisFromDbPoi(pois)

        if (!path) {
            logger.error(`Could not get track with id ${track.uid} as a line string`)
            res.sendStatus(500)
            return
        }

        if (!length) {
            logger.error(`Length of track with id ${track.uid} could not be determined`)
            res.sendStatus(500)
            return
        }

        const api_track: FullTrack = {
            id: track.uid,
            name: track.start + '-' + track.stop,
            path, length
        }

        res.json(api_track);
        return;
    }

}

/**
 * A utility "middleware-ish" function that, given a route segment `:trackID`, finds the respective track and
 * places it in the res.locals object, if such a track exists.
 *
 * Will directly respond with a 404 error otherwise.
 */
export const extractTrackID = please_dont_crash(async (req: Request, res: Response, next: NextFunction) => {
    const trackId: number = parseInt(req.params.trackId);

    // check if both are numbers, and not NaN or Infinity
    if (!isFinite(trackId)) {
        if (logger.isSillyEnabled())
            logger.silly(`Request for ${req.params.trackId} failed. Not a number`)
        res.sendStatus(404)
        return
    }

    // obtain the track from the database
    const track: Track | null = await TrackService.getTrackById(trackId)

    if (track) {
        // If the track exists, continue with route handling
        if (logger.isSillyEnabled())
            logger.silly(`Found track ${track.uid}`)
        res.locals.track = track;
        next()
        return;
    } else {
        // otherwise log and return 404
        if (logger.isSillyEnabled())
            logger.silly(`Request for ${req.params.trackId} failed. Not found in Database`)
        res.sendStatus(404)
        return
    }
});
