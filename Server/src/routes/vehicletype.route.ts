import { Request, Response, Router } from "express"
import { logger } from "../utils/logger"
import { authenticateJWT, jsonParser } from "."
import { UpdateVehicleType, VehicleType as APIVehicleType } from "../models/api"
import { VehicleType } from "@prisma/client"
import database from "../services/database.service"
import please_dont_crash from "../utils/please_dont_crash"
import { z } from "zod"

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
	 * The constructor to connect all the routes with specific functions.
	 */
	private constructor() {
		this.router.get("/", authenticateJWT, please_dont_crash(this.getAllTypes))
		this.router.get("/:typeId", authenticateJWT, please_dont_crash(this.getTypeById))
		this.router.post("/", authenticateJWT, jsonParser, please_dont_crash(this.createType))
		this.router.put("/:typeId", authenticateJWT, jsonParser, please_dont_crash(this.updateType))
		this.router.delete("/:typeId", authenticateJWT, please_dont_crash(this.deleteType))
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
	private async getAllTypes(req: Request, res: Response): Promise<void> {
		const vehicleTypes: VehicleType[] = await database.vehicles.getAllTypes()
		const ret: z.infer<typeof APIVehicleType>[] = vehicleTypes.map(({ description, icon, name, uid }) => ({
			id: uid, // FIXME: If the API uses uid, we can unify the model and the api definition of a VehicleType
			name,
			description: description ?? undefined,
			icon
		}))
		res.json(ret)
		return
	}

	/**
	 * Get the list of all vehicle types.
	 * @param req
	 * @param res A response containing a list of ``VehicleTypeListItemWebsite`` in its body
	 * @returns Nothing
	 */
	private async getTypeById(req: Request, res: Response): Promise<void> {
		// Get the typeId path parameter and convert to a number
		const typeID = Number.parseInt(req.params.typeId)

		// Check if the conversion was successful
		if (!Number.isFinite(typeID)) {
			if (logger.isSillyEnabled()) logger.silly(`Request for type ${req.params.typeId} failed. Not a number`)
			res.status(400).send("typeID not a number.")
			return
		}

		// Then try to acquire the type from the database
		const vehicleType: VehicleType = await database.vehicles.getTypeById(typeID)

		// convert it to the relevant API data type
		const responseType: z.infer<typeof APIVehicleType> = {
			id: vehicleType.uid,
			name: vehicleType.name,
			description: vehicleType.description ?? undefined,
			icon: vehicleType.icon
		}

		res.json(responseType)
		return
	}

	private async createType(req: Request, res: Response): Promise<void> {
		const vehicleTypePayload = UpdateVehicleType.parse(req.body)

		const vehicleType: VehicleType = await database.vehicles.saveType({
			name: vehicleTypePayload.name,
			icon: vehicleTypePayload.icon,
			description: vehicleTypePayload.description
		})

		const responseType: z.infer<typeof APIVehicleType> = {
			id: vehicleType.uid,
			name: vehicleType.name,
			description: vehicleType.description ?? undefined,
			icon: vehicleType.icon
		}

		res.status(201).json(responseType)
		return
	}

	/**
	 * Update or create a certain vehicle type.
	 * @param req A request containing a ``VehicleTypeCrUWebsite`` in its body.
	 * @param res
	 * @returns Nothing
	 */
	private async updateType(req: Request, res: Response): Promise<void> {
		// Get the typeId path parameter and convert to a number
		const typeID = Number.parseInt(req.params.typeId)

		// Check if the conversion was successful
		if (!Number.isFinite(typeID)) {
			if (logger.isSillyEnabled()) logger.silly(`Request for type ${req.params.typeId} failed. Not a number`)
			res.status(400).send("typeID not a number.")
			return
		}

		const vehicleTypePayload = APIVehicleType.parse(req.body)

		const type: VehicleType = await database.vehicles.getTypeById(typeID)

		// update all properties atomically, by directly talking to the database controller
		await database.vehicles.updateType(type.uid, {
			name: vehicleTypePayload.name,
			icon: vehicleTypePayload.icon,
			description: vehicleTypePayload.description
		})

		res.sendStatus(200)
		return
	}

	/**
	 * Delete a certain vehicle type.
	 * @param req A request containing a type id in its parameters.
	 * @param res
	 * @returns Nothing
	 */
	private async deleteType(req: Request, res: Response): Promise<void> {
		const typeId: number = parseInt(req.params.typeId)

		// Check if the conversion was successful
		if (!Number.isFinite(typeId)) {
			if (logger.isSillyEnabled()) logger.silly(`Request for type ${req.params.typeId} failed. Not a number`)
			res.status(400).send("typeID not a number")
			return
		}

		await database.vehicles.removeType(typeId)

		res.sendStatus(200)
		return
	}
}
