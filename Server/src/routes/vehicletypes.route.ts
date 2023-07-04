import { Request, Response, Router } from "express";
import { logger } from "../utils/logger";
import { authenticateJWT, jsonParser, v } from ".";
import VehicleService from "../services/vehicle.service";
import { VehicleTypeCrUWebsite, VehicleTypeListItemWebsite } from "../models/api.website";
import { VehicleCrUSchemaWebsite, VehicleTypeCrUSchemaWebsite } from "../models/jsonschemas.website";
import { VehicleType } from "@prisma/client";

/**
 * The router class for the routing of the vehicle data to app and website.
 */
export class VehicleRoute {
	/** The path of this api route. */
	public static path: string = "/vehicletype";
	/** The sub router instance. */
	private static instance: VehicleRoute;
	/** The base router object. */
	private router = Router();

	/**
	 * The constructor to connect all of the routes with specific functions.
	 */
	private constructor() {
		this.router.get("/website", authenticateJWT, this.getTypeList)
        this.router.post("/website", authenticateJWT, jsonParser, this.updateType)
        this.router.delete("/website/:typeId", authenticateJWT, this.deleteType)
    }

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!VehicleRoute.instance) {
			VehicleRoute.instance = new VehicleRoute();
		}
		return VehicleRoute.instance.router;
	}

	private getTypeList = async (req:Request, res: Response) => {
        const ret: VehicleTypeListItemWebsite[] = (await VehicleService.getAllVehicleTypes()).map((x) => {
            const ret: VehicleTypeListItemWebsite = {
                uid: x.uid,
                name: x.name,
                description: x.description ? x.description : undefined
            }
            return ret
            })
        
        if (!ret) {
            logger.error(`Could not collect list of vehicle types`)
            res.sendStatus(500)
            return
        }
    }

    private updateType = async (req:Request, res: Response) => {
        const userData: VehicleTypeCrUWebsite = req.body
        if (!userData 
            || !v.validate(userData, VehicleTypeCrUSchemaWebsite).valid) {
                res.sendStatus(400)
                return
        }

        if (userData.uid) {
            var type : VehicleType | null = await VehicleService.getVehicleTypeById(userData.uid)
            if (!type) {
                logger.error(`Could not find vehicle type with id ${userData.uid}`)
                res.sendStatus(500)
                return
            }

            type = await VehicleService.renameVehicleType(type, userData.name) // TODO: What about the description?!

            if (!type) {
                logger.error(`Could not update vehicle type with id ${userData.uid}`)
                res.sendStatus(500)
                return
            }

        } else {
            const type : VehicleType | null= await VehicleService.createVehicleType(userData.name)
            if (!type) {
                logger.error(`Could not create vehicle type`) 
                res.sendStatus(500)
                return
            }
            res.sendStatus(200)
            return
            // TODO: Wait for implementation for setter of description
        }

    }

    private deleteType = async (req:Request, res: Response) => {
        const typeId: number = parseInt(req.params.typeId)
        const type: VehicleType | null = await VehicleService.getVehicleTypeById(typeId)

        if (!type) {
            logger.error(`Could not find type to delete with id ${typeId}`)
            res.sendStatus(500)
            return
        }

        const success : boolean  = await VehicleService.removeVehicleType(type)

        if(!success) {
            logger.error(`Could not delete type with id ${typeId}`)
            res.sendStatus(500)
            return
        }
        
        res.sendStatus(200)
        return
    }

	
}
