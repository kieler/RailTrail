import { Request, Response, Router } from "express"
import { jsonParser, v } from "."
import { InitRequestApp, InitResponseApp, TrackListEntryApp } from "../models/api.app"
import { PointOfInterestTempApp, Position } from "../models/api"
import { logger } from "../utils/logger"
import { InitRequestSchemaApp } from "../models/jsonschemas.app"
import TrackService from "../services/track.service"
import { POI, Track } from "@prisma/client"
import POIService from "../services/poi.service"
import VehicleService from "../services/vehicle.service"
import { Feature, GeoJsonProperties, Point } from "geojson"
import GeoJSONUtils from "../utils/geojsonUtils"
import database from "../services/database.service"

// TODO: rename. Get rid of "init" routes

/**
 * The router class for the routing of the initialization dialog with app and website.
 */
export class InitRoute {
	/** The path of this api route. */
	public static path: string = "/init"
	/** The sub router instance. */
	private static instance: InitRoute
	/** The current router object. */
	private router = Router()

	/**
	 * The constructor to connect all of the routes with specific functions.
	 */
	private constructor() {
		this.router.get("/app/track/:trackId", (req, res) => {
			return this.getForTrack(req, res)
		})
		this.router.get("/app/tracks", (req, res) => {
			return this.getAllTracks(req, res)
		})
		this.router.put("/app", jsonParser, (req, res) => {
			return this.getTrackByPosition(req, res)
		})

		// this.router.get('/website', authenticateJWT, (req, res) => {return this.getAllTracks(req, res)})
		// this.router.get('/website/:trackId', authenticateJWT, (req, res) => {return this.getForTrackWebsite(req, res)})
	}

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!InitRoute.instance) {
			InitRoute.instance = new InitRoute()
		}
		return InitRoute.instance.router
	}

	/**
	 * This function is used to get the initialization data for a specific track.
	 * @param req The request that should contain a `trackId` in the parameters
	 * @param res The response with an InitResponse if successful,.
	 * @returns Nothing
	 */
	private async getForTrack(req: Request, res: Response): Promise<void> {
		if (!req.params.track) {
			logger.error(`Could not parse id`)
			res.sendStatus(400)
			return
		}

		const id: number = parseInt(req.params.trackId)

		const track: Track | null = await database.tracks.getById(id)

		if (!track) {
			logger.error(`Could not find a track with id ${id}.`)
			// a 404 (not found) is more appropriate than a 500 in this case
			res.sendStatus(404)
			return
		}

		const path: GeoJSON.GeoJSON | null = TrackService.getTrackAsLineString(track)
		const length: number | null = TrackService.getTrackLength(track)

		if (!path) {
			logger.error(`Could not find path of track with id ${id}`)
			res.sendStatus(500)
			return
		}

		if (!length) {
			logger.error(`Could not determine length of track with id ${id}`)
			res.sendStatus(500)
			return
		}

		const pois: POI[] = await POIService.getAllPOIsForTrack(track)
		const apiPois: PointOfInterestTempApp[] | null = await this.getAppPoisFromDbPoi(pois)

		if (!apiPois) {
			logger.error(`Could not convert database pois to app pois`)
			res.sendStatus(500)
			return
		}

		const ret: InitResponseApp = {
			trackId: id,
			trackName: track.start + "-" + track.stop,
			trackPath: path,
			trackLength: length,
			pointsOfInterest: apiPois
		}
		res.json(ret)
		return
	}

	/**
	 * This function is used to get a list of all tracknames in the system together with their internal id.
	 * @param _req The api request.
	 * @param res Will contain a list of TrackListEntries if successful.
	 * @returns Nothing
	 */
	private async getAllTracks(_req: Request, res: Response): Promise<void> {
		const ret: TrackListEntryApp[] = (await database.tracks.getAll()).map((track: Track) => {
			const ret: TrackListEntryApp = { id: track.uid, name: track.start + "-" + track.stop }
			return ret
		})
		res.json(ret)
		return
	}

	/**
	 * This function is used to find a specific track determined by a position.
	 *
	 * @param req The request that should contain a valid InitRequest in its body.
	 * @param res A response with a InitResponse in its body if successful.
	 * @returns Nothing
	 */
	private async getTrackByPosition(req: Request, res: Response): Promise<void> {
		const posWrapper: InitRequestApp = req.body
		if (!posWrapper || !v.validate(posWrapper, InitRequestSchemaApp).valid) {
			res.sendStatus(400)
			return
		}
		const pos: Position = posWrapper.pos

		const backendPos: Feature<Point, GeoJsonProperties> = {
			type: "Feature",
			geometry: { type: "Point", coordinates: [pos.lng, pos.lat] },
			properties: null
		}
		const currentTrack: Track | null = await VehicleService.getCurrentTrackForVehicle(backendPos)

		if (!currentTrack) {
			logger.error(`Could not find current track with position {lat : ${pos.lat}, lng : ${pos.lng}}`)
			res.sendStatus(500)
			return
		}

		const length: number | null = TrackService.getTrackLength(currentTrack)

		if (!length) {
			logger.error(`Length of track with id ${currentTrack.uid} could not be determined`)
			res.sendStatus(500)
			return
		}

		const pois: POI[] = await POIService.getAllPOIsForTrack(currentTrack)
		const apiPois: PointOfInterestTempApp[] | null = await this.getAppPoisFromDbPoi(pois)

		if (!apiPois) {
			logger.error(`Could not convert database pois to app pois`)
			res.sendStatus(500)
			return
		}

		const ret: InitResponseApp = {
			trackId: currentTrack.uid,
			trackName: currentTrack.start + "-" + currentTrack.stop,
			trackLength: length,
			pointsOfInterest: apiPois
		}
		res.json(ret)
		return
	}

	/**
	 * Convert a list of ``POI`` to a list of ``PointOfInterestApp``.
	 * @param pois The ``POI``s from the database.
	 * @returns A list of ``PointOfInterestApp``.
	 */
	private async getAppPoisFromDbPoi(pois: POI[]): Promise<PointOfInterestTempApp[] | null> {
		const apiPois: PointOfInterestTempApp[] = []
		for (const poi of pois) {
			const type: number = poi.typeId
			if (!type) {
				logger.error(`Could not determine type of poi with id ${poi.uid}`)
				return null
			}

			const geoJsonPos: Feature<Point, GeoJsonProperties> | null = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position)
			if (!geoJsonPos) {
				logger.error(`Could not find position of POI with id ${poi.uid}`)
				continue
			}
			const pos: Position = {
				lat: GeoJSONUtils.getLatitude(geoJsonPos),
				lng: GeoJSONUtils.getLongitude(geoJsonPos)
			}
			const percentagePosition: number | null = await POIService.getPOITrackDistancePercentage(poi)
			if (!percentagePosition) {
				logger.error(`Could not determine percentage position of poi with id ${poi.uid}`)
				return null
			}

			apiPois.push({
				name: poi.name,
				type: type > 4 || type < 0 ? 0 : type,  // If a type is unknown such that it can't be parsed by frontend, it will be set to 'None'
				pos: pos,
				percentagePosition: percentagePosition,
				isTurningPoint: poi.isTurningPoint
			})
		}
		return apiPois
	}
}
