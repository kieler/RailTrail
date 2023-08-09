import { Request, Response, Router } from "express"
import { logger } from "../utils/logger"
import { authenticateJWT, jsonParser, v } from "."
import VehicleService from "../services/vehicle.service"
import { UpdateVehicleType , VehicleType as APIVehicleType } from "../models/api"
import { VehicleCrUSchemaWebsite, VehicleTypeCrUSchemaWebsite } from "../models/jsonschemas.website"
import { VehicleType } from "@prisma/client"

/**
 * The router class for the routing of the vehicle data to app and website.
 */
export class VehicleTypeRoute {
    /** The path of this api route. */
    public static path: string = "/vehicletype"
    /** The sub router instance. */
    private static instance: VehicleTypeRoute
    /** The base router object. */
    private router = Router()

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
        if (!VehicleTypeRoute.instance) {
            VehicleTypeRoute.instance = new VehicleTypeRoute()
        }
        return VehicleTypeRoute.instance.router
    }

    /**
     * Get the list of all vehicle types.
     * @param req 
     * @param res A response containing a list of ``VehicleTypeListItemWebsite`` in its body
     * @returns Nothing
     */
    private async getTypeList(req: Request, res: Response): Promise<void> {
        const vehicleTypes: VehicleType[] = await VehicleService.getAllVehicleTypes()
        logger.info("Got all types from database")
        const ret: APIVehicleType[] = vehicleTypes.map((x) => {
            const ret: APIVehicleType = {
                id: x.uid, // FIXME: If the API uses uid, we can unify the model and the api definition of a VehicleType
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
        res.json(ret)
        return
    }

    /**
     * Update or create a certain vehicle type.
     * @param req A request containing a ``VehicleTypeCrUWebsite`` in its body.
     * @param res 
     * @returns Nothing
     */
    private async updateType(req: Request, res: Response): Promise<void> {
        const userData: UpdateVehicleType = req.body
        if (!userData
            || !v.validate(userData, VehicleTypeCrUSchemaWebsite).valid) {
            res.sendStatus(400)
            return
        }

        if (userData.id) {
            let type: VehicleType | null = await VehicleService.getVehicleTypeById(userData.id)
            if (!type) {
                logger.error(`Could not find vehicle type with id ${userData.id}`)
                res.sendStatus(500)
                return
            }

            type = await VehicleService.renameVehicleType(type, userData.name) // TODO: What about the description?!

            if (!type) {
                logger.error(`Could not update vehicle type with id ${userData.id}`)
                res.sendStatus(500)
                return
            }

        } else {
            const type: VehicleType | null = await VehicleService.createVehicleType(userData.name, '')
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

    /**
     * Delete a certain vehicle type.
     * @param req A request containing a type id in its parameters.
     * @param res 
     * @returns Nothing
     */
    private async deleteType(req: Request, res: Response): Promise<void> {
        const typeId: number = parseInt(req.params.typeId)
        const type: VehicleType | null = await VehicleService.getVehicleTypeById(typeId)

        if (!type) {
            logger.error(`Could not find type to delete with id ${typeId}`)
            res.sendStatus(500)
            return
        }

        const success: boolean = await VehicleService.removeVehicleType(type)

        if (!success) {
            logger.error(`Could not delete type with id ${typeId}`)
            res.sendStatus(500)
            return
        }

        res.sendStatus(200)
        return
    }
}
