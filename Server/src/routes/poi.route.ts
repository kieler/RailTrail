import { Request, Response, Router } from "express"
import { authenticateJWT, jsonParser } from "."
import { Position, UpdatePointOfInterest } from "../models/api"
import { logger } from "../utils/logger"
import POIService from "../services/poi.service"
import { Feature, Point } from "geojson"
import { POI, POIType, Prisma, Track } from "@prisma/client"
import database from "../services/database.service"
import GeoJSONUtils from "../utils/geojsonUtils"
import please_dont_crash from "../utils/please_dont_crash"
import { z } from "zod"

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
		this.router.get("", authenticateJWT, please_dont_crash(this.getAllPOIs))
		this.router.get("/:poiId", authenticateJWT, please_dont_crash(this.getOnePOI.bind(this)))
		this.router.post("", authenticateJWT, jsonParser, please_dont_crash(this.createPOI))
		this.router.put("/:poiId", authenticateJWT, jsonParser, please_dont_crash(this.updatePOI.bind(this)))
		this.router.delete("/:poiId", authenticateJWT, please_dont_crash(this.deletePOI.bind(this)))
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
		const pois: POI[] = await database.pois.getAll()

		const typedPOIs: z.infer<typeof UpdatePointOfInterest>[] = pois.map(
			({ uid, name, trackId, description, isTurningPoint, typeId, position }) => {
				const geoJsonPos: Feature<Point> = GeoJSONUtils.parseGeoJSONFeaturePoint(position)
				const pos: z.infer<typeof Position> = {
					lat: GeoJSONUtils.getLatitude(geoJsonPos),
					lng: GeoJSONUtils.getLongitude(geoJsonPos)
				}
				return {
					id: uid,
					typeId: typeId,
					name: name,
					description: description ?? undefined,
					pos: pos,
					isTurningPoint: isTurningPoint,
					trackId: trackId
				}
			}
		)
		res.json(typedPOIs)
		return
	}

	private async getOnePOI(req: Request, res: Response): Promise<void> {
		const poiId: number | null = this.extractPOiId(req)
		if (poiId == null) {
			res.status(400).send("POIId not a number.")
			return
		}

		const poi: POI = await database.pois.getById(poiId)

		const geoPos: Feature<Point> = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position)
		const pos: z.infer<typeof Position> = {
			lat: GeoJSONUtils.getLatitude(geoPos),
			lng: GeoJSONUtils.getLongitude(geoPos)
		}
		const updatePointOfInterest: z.infer<typeof UpdatePointOfInterest> = {
			id: poi.uid,
			typeId: poi.typeId,
			name: poi.name ?? "",
			description: poi.description ?? undefined,
			pos: pos,
			isTurningPoint: poi.isTurningPoint,
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
		const poiPayload = UpdatePointOfInterest.parse(req.body)

		const track: Track = await database.tracks.getById(poiPayload.trackId)

		const geopos: Feature<Point> = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [poiPayload.pos.lng, poiPayload.pos.lat]
			},
			properties: null
		}

		const type: POIType = await database.pois.getTypeById(poiPayload.typeId)

		const newPOI: POI = await POIService.createPOI(
			geopos,
			poiPayload.name ? poiPayload.name : "",
			type,
			track,
			poiPayload.description,
			poiPayload.isTurningPoint
		)

		res.json({ id: newPOI.uid })
		return
	}

	private async updatePOI(req: Request, res: Response): Promise<void> {
		const poiId: number | null = this.extractPOiId(req)

		if (poiId == null) {
			res.sendStatus(400)
			return
		}

		const poiPayload = UpdatePointOfInterest.parse(req.body)

		if (poiPayload.id == null) {
			res.sendStatus(400)
			return
		}

		const poiToUpdate: POI = await database.pois.getById(poiId)

		const geopos: Feature<Point> = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [poiPayload.pos.lng, poiPayload.pos.lat]
			},
			properties: null
		}

		const track: Track = await database.tracks.getById(poiPayload.trackId)

		const enrichedPoint = (await POIService.enrichPOIPosition(geopos, track)) ?? undefined

		// Note: geopos is from type GeoJSON.Feature and can't be parsed directly into Prisma.InputJsonValue
		// Therefore we cast it into unknown first.
		await database.pois.update(poiPayload.id, {
			name: poiPayload.name,
			description: poiPayload.description,
			position: enrichedPoint as unknown as Prisma.InputJsonValue,
			isTurningPoint: poiPayload.isTurningPoint,
			typeId: poiPayload.typeId,
			trackId: track.uid
		})

		res.json({ id: poiToUpdate.uid })
		return
	}

	/**
	 * This function is used to delete a poi.
	 * @param req The request containing a poiId within the request parameters
	 * @param res The api response
	 * @returns Nothing
	 */
	private async deletePOI(req: Request, res: Response): Promise<void> {
		const poiId: number | null = this.extractPOiId(req)
		if (poiId == null) {
			res.status(400).send("POIId not a number.")
			return
		}

		// Look out for the POI
		const poi: POI = await database.pois.getById(poiId)
		await database.pois.remove(poi.uid)

		res.sendStatus(200)
		return
	}

	/**
	 * Get the poi id path parameter and convert it to a number.
	 * @param req
	 * @param
	 * @private
	 */
	private extractPOiId(req: Request): number | null {
		const poiId: number = Number.parseInt(req.params?.poiId)
		// Check if the conversion was successful
		if (!Number.isFinite(poiId)) {
			if (logger.isSillyEnabled()) logger.silly(`Request for poi ${req.params.poiId} failed. Not a number`)
			return null
		}
		return poiId
	}
}
