import { Request, Response, Router } from "express"
import { authenticateJWT, jsonParser } from "."
import { POIType } from ".prisma/client"
import { CreatePOIType, POIType as APIPoiType } from "../models/api"
import { logger } from "../utils/logger"
import database from "../services/database.service"
import please_dont_crash from "../utils/please_dont_crash"
import { z } from "zod"

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

		const apiPoiTypes: z.infer<typeof APIPoiType>[] = poiTypes.map(({ uid, name, icon, description }) => {
			const type: z.infer<typeof APIPoiType> = {
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

		const poiType: POIType = await database.pois.getTypeById(typeID)

		const apiPoiType: z.infer<typeof APIPoiType> = {
			id: poiType.uid,
			name: poiType.name,
			description: poiType.description ?? undefined,
			icon: Number.parseInt(poiType.icon)
		}

		res.json(apiPoiType)
		return
	}

	private async createType(req: Request, res: Response): Promise<void> {
		const poiTypePayload = CreatePOIType.parse(req.body)

		const poiType: POIType = await database.pois.saveType({
			name: poiTypePayload.name,
			icon: poiTypePayload.icon.toString(),
			description: poiTypePayload.description
		})

		const responseType: z.infer<typeof APIPoiType> = {
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

		const poiTypePayload = CreatePOIType.parse(req.body)

		await database.pois.updateType(typeId, {
			name: poiTypePayload.name,
			icon: poiTypePayload.icon.toString(),
			description: poiTypePayload.description
		})

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
		await database.pois.removeType(typeId)
		res.sendStatus(200)
		return
	}
}
