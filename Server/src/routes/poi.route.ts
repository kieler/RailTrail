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
		const pois: POI[] | null = await database.pois.getAll()
		if (!pois) {
			logger.error(`Could not get the list of POI's`)
			res.sendStatus(500)
			return
		}
		const typedPOIs: (z.infer<typeof UpdatePointOfInterest> | null)[] = pois.map(
			({ uid, name, trackId, description, isTurningPoint, typeId, position }) => {
				const geoJsonPos: Feature<Point> | null = GeoJSONUtils.parseGeoJSONFeaturePoint(position)
				if (!geoJsonPos) {
					logger.error(`Could not find position of POI with id ${uid}`)
					// res.sendStatus(500)
					return null
				}
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

		const poi: POI | null = await database.pois.getById(poiId)
		if (!poi) {
			logger.error(`Could not find poi with id ${poiId}`)
			res.sendStatus(500)
			return
		}

		const geoPos: Feature<Point> | null = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position)
		if (!geoPos) {
			logger.error(`Could not find position of POI with id ${poi.uid}`)
			res.sendStatus(500)
			return
		}
		const pos: z.infer<typeof Position> = {
			lat: GeoJSONUtils.getLatitude(geoPos),
			lng: GeoJSONUtils.getLongitude(geoPos)
		}
		const updatePointOfInterest: z.infer<typeof UpdatePointOfInterest> = {
			id: poi.uid,
			name: poi.name ?? "",
			isTurningPoint: poi.isTurningPoint,
			description: poi.description ?? undefined,
			pos: pos,
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
		const userDataPayload = UpdatePointOfInterest.safeParse(req.body)
		if (!userDataPayload.success) {
			logger.error(userDataPayload.error)
			res.sendStatus(400)
			return
		}
		const userData = userDataPayload.data

		const track: Track | null = await database.tracks.getById(userData.trackId)

		if (!track) {
			logger.error(`Could not find track with id ${userData.trackId}`)
			res.sendStatus(500)
			return
		}

		const geopos: Feature<Point> = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [userData.pos.lng, userData.pos.lat]
			},
			properties: null
		}

		const type: POIType | null = await database.pois.getTypeById(userData.typeId)
		if (!type) {
			logger.error(`Could not find poi type with id ${userData.typeId}`)
			res.sendStatus(400)
			return
		}

		const newPOI: POI | null = await POIService.createPOI(
			geopos,
			userData.name ? userData.name : "",
			type,
			track,
			userData.description,
			userData.isTurningPoint
		)

		if (!newPOI) {
			logger.error(`Could not create new POI`)
			res.sendStatus(500)
			return
		}

		res.json({ id: newPOI.uid })
		return
	}

	private async updatePOI(req: Request, res: Response): Promise<void> {
		const poiId: number | null = this.extractPOiId(req)

		if (poiId == null) {
			res.sendStatus(400)
			return
		}

		const userDataPayload = UpdatePointOfInterest.safeParse(req.body)
		if (!userDataPayload.success) {
			logger.error(userDataPayload.error)
			res.sendStatus(400)
			return
		}
		const userData = userDataPayload.data

		if (userData.id == null) {
			res.sendStatus(400)
			return
		}

		const poiToUpdate: POI | null = await database.pois.getById(poiId)
		if (!poiToUpdate) {
			logger.error(`Could not find poi with id ${userData.id}`)
			res.sendStatus(404)
			return
		}

		const geopos: GeoJSON.Feature<GeoJSON.Point> = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [userData.pos.lng, userData.pos.lat]
			},
			properties: null
		}

		const track: Track | null = await database.tracks.getById(userData.trackId)
		if (track == null) {
			logger.error(`Could not find track with id ${userData.trackId} to update POI with id ${userData.id}.`)
			res.sendStatus(404)
			return
		}

		const enrichedPoint = (await POIService.enrichPOIPosition(geopos, track)) ?? undefined

		// Note: geopos is from type GeoJSON.Feature and can't be parsed directly into Prisma.InputJsonValue
		// Therefore we cast it into unknown first.
		const updatedPOI: POI | null = await database.pois.update(userData.id, {
			name: userData.name,
			description: userData.description,
			position: enrichedPoint as unknown as Prisma.InputJsonValue,
			isTurningPoint: userData.isTurningPoint,
			typeId: userData.typeId,
			trackId: track.uid
		})

		if (!updatedPOI) {
			logger.error(`Could not update poi with id ${userData.id}`)
			res.sendStatus(500)
			return
		}

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
		const poi: POI | null = await database.pois.getById(poiId)
		if (!poi) {
			logger.error(`Could not find poi with id ${poiId}`)
			res.sendStatus(500)
			return
		}
		await database.pois.remove(poi.uid)

		res.sendStatus(200)
		return
	}

	/**
	 * Get the poi id path parameter and convert it to a number.
	 * @param req
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
