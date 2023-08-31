import { Request, Response, Router } from "express"
import { logger } from "../utils/logger"
import { authenticateJWT, jsonParser } from "."
import { UpdateVehicleType, VehicleType as APIVehicleType } from "../models/api"
import { VehicleType } from "@prisma/client"
import database from "../services/database.service"
import please_dont_crash from "../utils/please_dont_crash"

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
		const queryName = req.query.name

		if (typeof queryName === "string") {
			// Then try to acquire the type from the database
			const vehicleType: VehicleType | null = await database.vehicles.getTypeByName(queryName)
			// And check if it existed
			if (!vehicleType) {
				if (logger.isSillyEnabled()) logger.silly(`Request for type ${req.params.typeId} failed. Not found`)
				res.sendStatus(404)
				return
			}

			// else, convert it to the relevant API data type
			const responseType: APIVehicleType = {
				id: vehicleType.uid,
				name: vehicleType.name,
				description: vehicleType.description ?? undefined,
				icon: vehicleType.icon
			}

			res.json(responseType)
			return
		} else {
			const vehicleTypes: VehicleType[] = await database.vehicles.getAllTypes()
			logger.info("Got all types from database")
			const ret: APIVehicleType[] = vehicleTypes.map(({ description, icon, name, uid }) => ({
				id: uid, // FIXME: If the API uses uid, we can unify the model and the api definition of a VehicleType
				name,
				description: description ?? undefined,
				icon
			}))

			res.json(ret)
			return
		}
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
		const vehicleType: VehicleType | null = await database.vehicles.getTypeById(typeID)
		// And check if it existed
		if (!vehicleType) {
			if (logger.isSillyEnabled()) logger.silly(`Request for type ${req.params.typeId} failed. Not found`)
			res.sendStatus(404)
			return
		}

		// else, convert it to the relevant API data type
		const responseType: APIVehicleType = {
			id: vehicleType.uid,
			name: vehicleType.name,
			description: vehicleType.description ?? undefined,
			icon: vehicleType.icon
		}

		res.json(responseType)
		return
	}

	private async createType(req: Request, res: Response): Promise<void> {
		const userData: UpdateVehicleType = req.body

		// TODO: input validation

		const vehicleType: VehicleType | null = await database.vehicles.saveType({
			name: userData.name,
			icon: userData.icon,
			description: userData.description
		})
		if (!vehicleType) {
			// TODO: differentiate different error causes:
			//       Constraint violation   => 409
			//       Database not reachable => 500
			//       etc.
			logger.error(`Could not create vehicle type`)
			res.sendStatus(500)
			return
		}

		const responseType: APIVehicleType = {
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

		const userData: APIVehicleType = req.body
		if (userData.id !== typeID) {
			res.sendStatus(400)
			return
		}
		// TODO: input validation

		//if (!userData
		//    || !v.validate(userData, VehicleTypeCrUSchemaWebsite).valid) {
		//    res.sendStatus(400)
		//    return
		//}

		let type: VehicleType | null = await database.vehicles.getTypeById(typeID)
		if (!type) {
			// TODO: differentiate different error causes:
			//       Not found              => 404
			//       Database not reachable => 500
			//       etc.
			logger.error(`Could not find vehicle type with id ${typeID}`)
			res.sendStatus(500)
			return
		}

		// type = await VehicleService.renameVehicleType(type, userData.name) // TODO: What about the description?!

		// update all properties atomically, by directly talking to the database controller
		type = await database.vehicles.updateType(type.uid, {
			name: userData.name,
			icon: userData.icon,
			description: userData.description
		})

		if (!type) {
			// TODO: differentiate different error causes:
			//       Constraint violation   => 409
			//       Database not reachable => 500
			//       etc.
			logger.error(`Could not update vehicle type with id ${typeID}`)
			res.sendStatus(500)
			return
		}

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

		const success: boolean = await database.vehicles.removeType(typeId)
		if (!success) {
			// TODO: differentiate different error causes:
			//       Not Found              => 404
			//       Constraint violation   => 409
			//       Database not reachable => 500
			//       etc.
			logger.error(`Could not delete type with id ${typeId}`)
			res.sendStatus(500)
			return
		}

		res.sendStatus(200)
		return
	}
}
