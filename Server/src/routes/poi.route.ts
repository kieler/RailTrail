import { Router, Request, Response } from "express";
import { authenticateJWT, jsonParser, v } from ".";
import { UpdateAddPOIWebsite } from "../models/api.website";
import { PositionSchemaWebsite, UpdateAddPOISchemaWebsite } from "../models/jsonschemas.website";
import { logger } from "../utils/logger";
import POIService from "../services/poi.service";
import { Feature, GeoJsonProperties, Point } from "geojson";
import { POI, POIType } from "@prisma/client";

/**
 * The router class for the routing of the poi interactions with the website.
 */
export class PoiRoute {
    /** The path of this api route. */
    public static path: string = "/poi";
    /** The sub router instance. */
    private static instance: PoiRoute;
    /** The base router object. */
    private router = Router();

    /**
     * The constructor to connect all of the routes with specific functions. 
     */
    private constructor() {
        this.router.post('/website', authenticateJWT, jsonParser, this.changePoi)
        this.router.delete('/website/:poiId', authenticateJWT, this.deletePoi)
    }
    /**
     * Creates an instance if there is none yet.
     */
    static get router() {
        if (!PoiRoute.instance) {
            PoiRoute.instance = new PoiRoute();
        }
        return PoiRoute.instance.router;
    }

    /**
     * Function to change a poi. It is overloaded such that both the creation and updating of the poi 
     * will happen through this endpoint.
     * @param req The request that needs to contain an UpdateAddPOI in its requestbody.
     * @param res The response containing the id of the updated/added poi
     * @returns Nothing
     */
    private changePoi = async (req: Request, res: Response) => {
        const userData: UpdateAddPOIWebsite = req.body
        if (!userData || !(await v.validate(userData, UpdateAddPOISchemaWebsite).valid)
        ) {
            res.sendStatus(400)
            return

        }
         if (!userData.id) {
            const geopos: GeoJSON.Feature<GeoJSON.Point> = {
                type: 'Feature', geometry: {
                    type: 'Point',
                    coordinates: [userData.pos.lat, userData.pos.lng]
                }, properties: null
            } // TODO: Check if this is correct
            const type: POIType | null = await POIService.getPOIById(userData.type)
            if (!type) {
                logger.error(`Could not find poi type with id ${userData.type}`)
                res.sendStatus(500)
                return
            }
            const newPoi: POI | null = await POIService.createPOI(geopos, userData.name ? userData.name : '', type)
            // TODO: What about isTurningPoint and type, and track maybe

            res.json({ id: newPoi?.uid });
            return
        } else {
            const poiToUpdate: POI | null= await POIService.getPOIById(userData.id)
            if (!poiToUpdate){
                logger.error(`Could not find poi with id ${userData.id}`)
                res.sendStatus(500)
                return
            }

            const geopos: GeoJSON.Feature<GeoJSON.Point> = {
                type: 'Feature', geometry: {
                    type: 'Point',
                    coordinates: [userData.pos.lat, userData.pos.lng]
                },
                properties: null
            } // TODO: Check if this is correct
            await POIService.setPOIPosition(poiToUpdate, geopos)

            const type: POIType | null = await POIService.getPOIById(userData.type)
            if (!type) {
                logger.error(`Could not find poi type with id ${userData.type}`)
                res.sendStatus(500)
                return
            }
            await POIService.setPOIType(poiToUpdate, type)
            await POIService.renamePOI(poiToUpdate, userData.name ? userData.name : '')
            res.json({id : poiToUpdate.uid})
            return
        }


    }

    /**
     * This function is used to delete a poi.
     * @param req The request containing a poiId within the request parameters
     * @param res The api response
     * @returns Nothing
     */
    private deletePoi = async (req: Request, res: Response) => {
        const poiId: number = parseInt(req.params?.poiId);

        const poi : POI | null = await POIService.getPOIById(poiId)
        if (!poi) {
            logger.error(`Could not find poi with id ${poiId}`)
            res.sendStatus(500)
            return
        }
        await POIService.removePOI(poi)
        res.sendStatus(200)
        return
    }
}
