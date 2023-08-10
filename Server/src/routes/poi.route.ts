import {Request, Response, Router} from "express"
import {authenticateJWT, jsonParser} from "."
import {UpdatePointOfInterest} from "../models/api"
import {logger} from "../utils/logger"
import POIService from "../services/poi.service"
import {Feature, GeoJSON, Point} from "geojson"
import {POI, POIType, Track} from "@prisma/client"
import database from "../services/database.service";
import {extractTrackID} from "./track.route";

/**
 * The router class for the routing of the poi interactions with the website.
 */
export class PoiRoute {
    /** The path of this api route. */
    public static path: string = "/poi"
    /** The sub router instance. */
    private static instance: PoiRoute
    /** The base router object. */
    private router = Router()

    /**
     * The constructor to connect all the routes with specific functions.
     */
    private constructor() {
        this.router.get("", authenticateJWT, this.getAllPOIs)
        this.router.get("/:poiId", authenticateJWT, this.getOnePOI)
        this.router.post("/:trackId", authenticateJWT, jsonParser, extractTrackID, this.createPOI)
        this.router.put("/:poiId", authenticateJWT, jsonParser, this.updatePOI)
        this.router.delete("/:poiId", authenticateJWT, this.deletePOI)
    }

    /**
     * Creates an instance if there is none yet.
     */
    static get router() {
        if (!PoiRoute.instance) {
            PoiRoute.instance = new PoiRoute()
        }
        return PoiRoute.instance.router
    }

    private async getAllPOIs(_req: Request, res: Response): Promise<void> {
        const pois: POI[] | null = await database.pois.getAll()
        if (!pois) {
            logger.error(`Could not get the list of POI's`)
            res.sendStatus(500)
            return
        }
        const typedPOIs: UpdatePointOfInterest[] = pois.map(({
                                                                 uid, name,
                                                                 trackId, description,
                                                                 isTurningPoint, typeId,
                                                                 position
                                                             }) => ({
            id: uid,
            typeId: typeId,
            name: name,
            description: description ?? undefined,
            pos: {lat: -1, lng: -1}, //TODO: Convert prisma position to API Position
            isTurningPoint: isTurningPoint,
            trackId: trackId,
        }))
        res.json(typedPOIs)
        return
    }

    private async getOnePOI(req: Request, res: Response): Promise<void> {
        // Get the poiId path parameter and convert to a number
        const poiId: number = Number.parseInt(req.params.poiId)

        // Check if the conversion was successful
        if (!Number.isFinite(poiId)) {
            if (logger.isSillyEnabled())
                logger.silly(`Request for type ${req.params.poiId} failed. Not a number`)
            res.status(400).send('poiId not a number.')
            return
        }

        const poi: POI | null = await database.pois.getById(poiId)
        if (!poi) {
            logger.error(`Could not find poi with id ${poiId}`)
            res.sendStatus(500)
            return
        }
        const updatePointOfInterest: UpdatePointOfInterest = {
            id: poi.uid,
            name: poi.name ?? '',
            isTurningPoint: poi.isTurningPoint,
            description: poi.description ?? undefined,
            pos: {lat: -1, lng: -1}, //TODO: Convert db pos to lat, lng pair
            typeId: poi.typeId,
            trackId: poi.trackId
        }
        res.json(updatePointOfInterest)
        return
    }

    /**
     * Function to change a poi. It is overloaded such that both the creation and updating of the poi
     * will happen through this endpoint.
     * @param req The request that needs to contain an UpdateAddPOI in its requestbody.
     * @param res The response containing the id of the updated/added poi
     * @returns Nothing
     */
    private async createPOI(req: Request, res: Response): Promise<void> {
        const track: Track = res.locals.track

        const userData: UpdatePointOfInterest = req.body
        if (!userData //|| !(v.validate(userData, UpdateAddPOISchemaWebsite).valid)
        ) {
            res.sendStatus(400)
            return
        }

        const geopos: Feature<Point> = {
            type: 'Feature', geometry: {
                type: 'Point',
                coordinates: [userData.pos.lat, userData.pos.lng]
            }, properties: null
        } // TODO: Check if this is correct

        const type: POIType | null = await POIService.getPOITypeById(userData.typeId)
        if (!type) {
            logger.error(`Could not find poi type with id ${userData.typeId}`)
            res.sendStatus(400)
            return
        }

        const newPOI: POI | null = await POIService.createPOI(geopos, userData.name ? userData.name : '', type, track,
            userData.description, userData.isTurningPoint)

        if (!newPOI) {
            logger.error(`Could not create new POI`)
            res.sendStatus(500)
            return
        }

        res.json({id: newPOI.uid})
        return
    }

    private async updatePOI(req: Request, res: Response): Promise<void> {
        const userData: UpdatePointOfInterest = req.body
        if (!userData || !userData.id //|| !(v.validate(userData, UpdateAddPOISchemaWebsite).valid)
        ) {
            res.sendStatus(400)
            return
        }

        const poiToUpdate: POI | null = await POIService.getPOIById(userData.id)
        if (!poiToUpdate) {
            logger.error(`Could not find poi with id ${userData.id}`)
            res.sendStatus(404)
            return
        }

        const geopos: GeoJSON.Feature<GeoJSON.Point> = {
            type: 'Feature', geometry: {
                type: 'Point',
                coordinates: [userData.pos.lat, userData.pos.lng]
            },
            properties: null
        } // TODO: Check if this is correct

        const updatedPOI: POI | null = await database.pois.update(userData.id, userData.name, userData.description, userData.typeId,
            userData.trackId, geopos, userData.isTurningPoint)

        if (!updatedPOI) {
            logger.error(`Could not update poi with id ${userData.id}`)
            res.sendStatus(500)
            return
        }

        res.json({id: poiToUpdate.uid})
        return
    }


    /**
     * This function is used to delete a poi.
     * @param req The request containing a poiId within the request parameters
     * @param res The api response
     * @returns Nothing
     */
    private async deletePOI(req: Request, res: Response): Promise<void> {
        const poiId: number = Number.parseInt(req.params?.poiId)

        // Check if the conversion was successful
        if (!Number.isFinite(poiId)) {
            if (logger.isSillyEnabled())
                logger.silly(`Request for poi ${req.params.poiId} failed. Not a number`)
            res.status(400).send('POIId not a number.')
            return
        }

        // Look out for the POI
        const poi: POI | null = await POIService.getPOIById(poiId)
        if (!poi) {
            logger.error(`Could not find poi with id ${poiId}`)
            res.sendStatus(500)
            return
        }
        const success: boolean = await POIService.removePOI(poi)
        if (!success) {
            logger.error(`Could not delete poi with id ${poiId}`)
            res.sendStatus(500)
            return
        }
        res.sendStatus(200)
        return
    }
}
