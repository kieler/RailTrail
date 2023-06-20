import { Router, Request, Response } from "express";
import { authenticateJWT, jsonParser, v } from ".";
import { UpdateAddPOIWebsite } from "../models/api.website";
import { PositionSchemaWebsite, UpdateAddPOISchemaWebsite } from "../models/jsonschemas.website";

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
        // TODO: Check if we have to do this in initialisation
        if (!userData //|| !v.validate(userData, UpdateAddPOISchema).valid
        ) {
            // FIXME: Add service call
        }

        res.json({ id: 1 });
        res.sendStatus(200)
        return
    }

    /**
     * This function is used to delete a poi.
     * @param req The request containing a poiId within the request parameters
     * @param res The api response
     * @returns Nothing
     */
    private deletePoi = async (req: Request, res: Response) => {
        const poiId: number = parseInt(req.params?.poiId);
        // FIXME: Add service call

        res.sendStatus(200)
        return
    }
}
