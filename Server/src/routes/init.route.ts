import { Request, Response, Router } from "express"
import { jsonParser } from "."
import { InitRequestApp, InitResponseApp, TrackListEntryApp } from "../models/api.app"
import { PointOfInterest, POITypeIcon, POITypeIconEnum, Position } from "../models/api"
import { logger } from "../utils/logger"
import TrackService from "../services/track.service"
import { POI, POIType, Track } from "@prisma/client"
import POIService from "../services/poi.service"
import { Feature, FeatureCollection, LineString, Point } from "geojson"
import GeoJSONUtils from "../utils/geojsonUtils"
import database from "../services/database.service"
import please_dont_crash from "../utils/please_dont_crash"
import { z } from "zod"

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
	 * The constructor to connect all the routes with specific functions.
	 */
	private constructor() {
		this.router.get("/app/track/:trackId", please_dont_crash(this.getForTrack.bind(this)))
		this.router.get("/app/tracks", please_dont_crash(this.getAllTracks))
		this.router.put("/app", jsonParser, please_dont_crash(this.getTrackByPosition.bind(this)))

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
	 * @param res The response with an InitResponse if successful.
	 * @returns Nothing
	 */
	private async getForTrack(req: Request, res: Response): Promise<void> {
		const id: number = Number.parseInt(req.params.trackId)
		if (!Number.isFinite(id)) {
			logger.error(`Could not parse id.`)
			res.sendStatus(400)
			return
		}

		const track: Track = await database.tracks.getById(id)

		const lineString: Feature<LineString> | null = TrackService.getTrackAsLineString(track)
		if (!lineString) {
			logger.error(`Could not convert track to line string`)
			res.sendStatus(500)
			return
		}

		const path: FeatureCollection<LineString> = {
			type: "FeatureCollection",
			features: [lineString]
		}

		const length: number | null = TrackService.getTrackLength(track)
		if (length == null) {
			logger.error(`Could not determine length of track with id ${id}`)
			res.sendStatus(500)
			return
		}

		const pois: POI[] = await POIService.getAllPOIsForTrack(track)
		const apiPois: z.infer<typeof PointOfInterest>[] = await this.getAppPoisFromDbPoi(pois)

		const ret: z.infer<typeof InitResponseApp> = {
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
	 * This function is used to get a list of all track names in the system together with their internal id.
	 * @param _req The api request.
	 * @param res Will contain a list of TrackListEntries if successful.
	 * @returns Nothing
	 */
	private async getAllTracks(_req: Request, res: Response): Promise<void> {
		const ret: z.infer<typeof TrackListEntryApp>[] = (await database.tracks.getAll()).map((track: Track) => {
			const ret: z.infer<typeof TrackListEntryApp> = { id: track.uid, name: track.start + "-" + track.stop }
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
		const pos: z.infer<typeof Position> = InitRequestApp.parse(req.body).pos

		const backendPos: Feature<Point> = {
			type: "Feature",
			geometry: { type: "Point", coordinates: [pos.lng, pos.lat] },
			properties: null
		}
		const currentTrack: Track | null = await TrackService.getClosestTrack(backendPos)

		if (!currentTrack) {
			logger.error(`Could not find current track with position {lat : ${pos.lat}, lng : ${pos.lng}}`)
			res.sendStatus(500)
			return
		}

		const length: number | null = TrackService.getTrackLength(currentTrack)

		if (length == null) {
			logger.error(`Length of track with id ${currentTrack.uid} could not be determined`)
			res.sendStatus(500)
			return
		}

		const pois: POI[] = await POIService.getAllPOIsForTrack(currentTrack)
		const apiPois: z.infer<typeof PointOfInterest>[] = await this.getAppPoisFromDbPoi(pois)

		const lineString: Feature<LineString> | null = TrackService.getTrackAsLineString(currentTrack)
		if (!lineString) {
			logger.error(`Could not read track with id ${currentTrack.uid} as line string`)
			res.sendStatus(500)
			return
		}

		const path: FeatureCollection<LineString> = {
			type: "FeatureCollection",
			features: [lineString]
		}

		const ret: z.infer<typeof InitResponseApp> = {
			trackId: currentTrack.uid,
			trackName: currentTrack.start + "-" + currentTrack.stop,
			trackLength: length,
			pointsOfInterest: apiPois,
			trackPath: path
		}
		res.json(ret)
		return
	}

	/**
	 * Convert a list of ``POI`` to a list of ``PointOfInterestApp``.
	 * @param pois The ``POI``s from the database.
	 * @returns A list of ``PointOfInterestApp``.
	 */
	private async getAppPoisFromDbPoi(pois: POI[]): Promise<z.infer<typeof PointOfInterest>[]> {
		const apiPois: z.infer<typeof PointOfInterest>[] = []
		for (const poi of pois) {
			let type: POIType
			try {
				type = await database.pois.getTypeById(poi.typeId)
			} catch (_err) {
				logger.error(`Could not determine type of poi with id ${poi.uid}`)
				continue
			}
			const poiIcon: number = Number.parseInt(type.icon)
			if (!Number.isInteger(poiIcon)) {
				logger.error(`Icon of type with id ${type.uid} is not an integer.`)
				continue
			}
			// Check if the icon number is a member of the enum.
			if (!(poiIcon in POITypeIcon.enum)) {
				logger.warn(`Icon of type with id ${type.uid} is ${poiIcon}, not one of the known icons.`)
			}
			// ensure that the app always gets an enum member.
			const appType: z.infer<typeof POITypeIcon> = poiIcon in POITypeIcon.enum ? poiIcon : POITypeIconEnum.Generic

			const geoJsonPos: Feature<Point> | null = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position)
			if (!geoJsonPos) {
				logger.error(`Could not find position of POI with id ${poi.uid}`)
				continue
			}
			const pos: z.infer<typeof Position> = {
				lat: GeoJSONUtils.getLatitude(geoJsonPos),
				lng: GeoJSONUtils.getLongitude(geoJsonPos)
			}
			const percentagePosition: number | null = await POIService.getPOITrackDistancePercentage(poi)
			if (percentagePosition == null) {
				logger.error(`Could not determine percentage position of poi with id ${poi.uid}`)
				continue
			}

			apiPois.push({
				id: poi.uid,
				name: poi.name,
				typeId: appType,
				pos: pos,
				percentagePosition: percentagePosition,
				isTurningPoint: poi.isTurningPoint,
				trackId: poi.trackId
			})
		}
		return apiPois.flat()
	}
}
