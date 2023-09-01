import { Request, Response, Router } from "express"
import { authenticateJWT, jsonParser } from "."
import { POIType } from ".prisma/client"
import { CreatePOIType, POIType as APIPoiType } from "../models/api"
import { logger } from "../utils/logger"
import database from "../services/database.service"
import please_dont_crash from "../utils/please_dont_crash"

/**
 * The router class for the routing of the POIType data to app and website.
 */
export class PoiTypeRoute {
	/** The path of this api route. */
	public static path: string = "/poitype"
	/** The sub router instance. */
	private static instance: PoiTypeRoute
	/** The base router object. */
	private router = Router()

	/**
	 * The constructor to connect all of the routes with specific functions.
	 */
	private constructor() {
		this.router.get("/", authenticateJWT, please_dont_crash(this.getAllTypes))
		this.router.get("/:typeId", authenticateJWT, please_dont_crash(this.getType))
		this.router.post("/", authenticateJWT, jsonParser, please_dont_crash(this.createType))
		this.router.put("/:typeId", authenticateJWT, jsonParser, please_dont_crash(this.updateType))
		this.router.delete("/:typeId", authenticateJWT, please_dont_crash(this.deleteType))
	}

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!PoiTypeRoute.instance) {
			PoiTypeRoute.instance = new PoiTypeRoute()
		}
		return PoiTypeRoute.instance.router
	}

	private async getAllTypes(_req: Request, res: Response): Promise<void> {
		const poiTypes: POIType[] = await database.pois.getAllTypes()

		const apiPoiTypes: APIPoiType[] = poiTypes.map(({ uid, name, icon, description }) => {
			const type: APIPoiType = {
				id: uid,
				name,
				icon: Number.parseInt(icon),
				description: description ?? undefined
			}
			return type
		})

		res.json(apiPoiTypes)
		return
	}

	private async getType(req: Request, res: Response): Promise<void> {
		const typeID = Number.parseInt(req.params.typeId)
		if (!Number.isFinite(typeID)) {
			if (logger.isSillyEnabled()) logger.silly(`Request for type ${req.params.typeId} failed. Not a number`)
			res.status(400).send("typeID not a number")
			return
		}

		const poiType: POIType | null = await database.pois.getTypeById(typeID)
		if (!poiType) {
			if (logger.isSillyEnabled()) logger.silly(`Request for type ${req.params.typeId} failed. Not found`)
			res.sendStatus(404)
			return
		}

		const apiPoiType: APIPoiType = {
			id: poiType.uid,
			name: poiType.name,
			description: poiType.description ?? undefined,
			icon: Number.parseInt(poiType.icon)
		}

		res.json(apiPoiType)
		return
	}

	private async createType(req: Request, res: Response): Promise<void> {
		// TODO: ensure that the icon is a member of the enum (or check if the type guard checks that)
		const { name, icon, description }: CreatePOIType = req.body

		const poiType: POIType | null = await database.pois.saveType(name, icon.toString(), description)
		if (!poiType) {
			logger.error("Could not create poi type")
			res.sendStatus(500)
			return
		}

		const responseType: APIPoiType = {
			id: poiType.uid,
			name: poiType.name,
			icon: Number.parseInt(poiType.icon),
			description: poiType.description ?? undefined
		}
		res.status(201).json(responseType)
		return
	}

	private async updateType(req: Request, res: Response): Promise<void> {
		const typeId: number = parseInt(req.params.typeId)
		const userData: APIPoiType = req.body
		// TODO: ensure that the icon is a member of the enum (or check if the type guard checks that)
		if (userData.id !== typeId) {
			res.sendStatus(400)
			return
		}

		let type: POIType | null = await database.pois.getTypeById(typeId)
		if (!type) {
			logger.error(`Could not find poi type with id ${typeId}`)
			res.sendStatus(404)
			return
		}

		type = await database.pois.updateType(typeId, userData.name, userData.icon.toString(), userData.description)
		if (!type) {
			logger.error(`Could not update poi type with id ${userData.id}`)
			res.sendStatus(500)
			return
		}

		res.sendStatus(200)
		return
	}

	private async deleteType(req: Request, res: Response): Promise<void> {
		const typeId: number = parseInt(req.params.typeId)
		if (!Number.isFinite(typeId)) {
			if (logger.isSillyEnabled()) logger.silly(`Request for type ${req.params.typeId} failed. Not a number`)
			res.status(400).send("typeID not a number")
			return
		}

		const success: boolean = await database.pois.removeType(typeId)
		if (!success) {
			logger.error(`Could not delete poi type with id ${typeId}`)
			res.sendStatus(500)
			return
		}

		res.sendStatus(200)
		return
	}
}
