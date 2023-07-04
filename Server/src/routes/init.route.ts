import { Request, Response, Router } from "express";
import { authenticateJWT } from ".";
import { InitResponseApp, PositionApp, POIType, TrackListEntryApp, InitRequestApp, PointOfInterestApp } from "../models/api.app";
import { InitResponseWebsite, PointOfInterestWebsite } from "../models/api.website";
import { logger } from "../utils/logger";
import { jsonParser, v } from ".";
import { PositionSchemaApp } from "../models/jsonschemas.app";
import TrackService from "../services/track.service";
import { POI, Track } from "@prisma/client";
import POIService from "../services/poi.service";
import VehicleService from "../services/vehicle.service";
import { Feature, GeoJsonProperties, Point } from "geojson";
import { Position } from "@turf/helpers";

/**
 * The router class for the routing of the initialization dialog with app and website.
 */
export class InitRoute {
	/** The path of this api route. */
	public static path: string = "/init";
	/** The sub router instance. */
	private static instance: InitRoute;
	/** The current router object. */
	private router = Router();

	/**
	 * The constructor to connect all of the routes with specific functions. 
	 */
	private constructor() {
		this.router.get('/app/track/:trackId', this.getForTrack);
		this.router.get('/app/tracks', this.getAllTracks);
		this.router.put('/app', jsonParser, this.getTrackByPosition);

		this.router.get('/website', authenticateJWT, jsonParser, this.getAllTracks);
		this.router.get('/website/:trackId', authenticateJWT, jsonParser, this.getForTrackWebsite);
	}

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!InitRoute.instance) {
			InitRoute.instance = new InitRoute();
		}
		return InitRoute.instance.router;
	}

	/**
	 * This function is used to get the initialization data for a specific track.
	 * @param req The request that should contain a `trackId` in the parameters
	 * @param res The response with an InitResponse if successful,.
	 * @returns Nothing
	 */
	private getForTrack = async (req: Request, res: Response) => {
		const id: number = parseInt(req.params.trackId)
		if (!id) {
			res.sendStatus(400)
			return
		}
		logger.info(
			`Got init request for track ${id}`
		)
		const track: Track | null = await TrackService.getTrackById(id)
		if (!track) {
			logger.error(`Could not find a track with id ${id}.`)
			res.sendStatus(500)
			return
		}
		const path: GeoJSON.GeoJSON = await TrackService.getTrackAsLineString(track)
		const length: number | null = await TrackService.getTrackLength(track)
		if (!length) {
			logger.error(`Could not determine length of track with id ${id}`)
			res.sendStatus(500)
			return
		}
		const pois: POI[] = await POIService.getAllPOIsForTrack(track)
		const apiPois: PointOfInterestApp[] = []
		for (const poi of pois) {
			// TODO: Map db poitype to api poitype
			const poiType: POIType | null = null //await POIService.getPOITypeById(poi.typeId)
			if (!poiType) {
				logger.error(`Could not determine type of poi with id ${poi.uid}`)
				res.sendStatus(500)
				return
			}
			const ppos: number | null = await POIService.getPOITrackDistancePercentage(poi)
			if (!ppos) {
				logger.error(`Could not determine percentage position of poi with id ${poi.uid}`)
				res.sendStatus(500)
				return
			}
			const position = poi.position
			// TODO: how to map from Prisma.JsonValue to position
			const apiPoi: PointOfInterestApp = {
				type: poiType == null ? POIType.None : poiType,
				name: poi.name,
				pos: { lat: 50, lng: 10 },
				percentagePosition: ppos,
				isTurningPoint: true
			}
			apiPois.push(apiPoi)
		}

		const ret: InitResponseApp = {
			trackId: id,
			trackName: track.start + '-' + track.stop,
			trackPath: path,
			trackLength: length,
			pointsOfInterest: apiPois
		}
		res.json(ret);
		return;
	};

	/**
	 * This function is used to get a list of all tracknames in the system together with their internal id.
	 * @param req The api request.
	 * @param res Will contain a list of TrackListEntries if successful.
	 * @returns Nothing
	 */
	private getAllTracks = async (req: Request, res: Response) => {

		const ret: TrackListEntryApp[] = await
			(await TrackService.getAllTracks()).map((track: Track) => {
				const ret: TrackListEntryApp = { id: track.uid, name: track.start + '-' + track.stop };
				return ret
			})
		res.json(ret)
		return
	};

	/**
	 * This function is used to find a specific track determined by a position.
	 * 
	 * @param req The request that should contain a valid InitRequest in its body. 
	 * @param res A response with a InitResponse in its body if successful.
	 * @returns Nothing
	 */
	private getTrackByPosition = async (req: Request, res: Response) => {
		const posWrapper: InitRequestApp = req.body;
		const pos: PositionApp = posWrapper?.pos;
		if (!pos //|| !v.validate(pos, PositionSchema).valid
		) {
			res.sendStatus(400);
			return;
		}

		const backendPos: Feature<Point, GeoJsonProperties> = {type: 'Feature', geometry: {type: 'Point', coordinates: [pos.lat, pos.lng]}, properties : null}
		const currentTrack: Track | null = await VehicleService.getCurrentTrackForVehicle(backendPos)
		if (!currentTrack) {
			logger.error(`Could not find current track with position {lat : ${pos.lat}, lng : ${pos.lng}}`)
			res.sendStatus(500)
			return
		}
		const length: number | null = await TrackService.getTrackLength(currentTrack)
		if (!length) {
			logger.error(`Length of track with id ${currentTrack.uid} could not be determined`)
			res.sendStatus(500)
			return
		}

		const pois: POI[] = await POIService.getAllPOIsForTrack(currentTrack)
		const apiPois: PointOfInterestApp[] = []
		for (const poi of pois) {
			const type: POIType = poi.typeId
			const pos: PositionApp = {lat:-1, lng: -1}// TODO: Do something with the position poi.position.
			const percentagePosition : number | null  = await POIService.getPOITrackDistancePercentage(poi) 
			if (!percentagePosition) {
				logger.error(`Could not determine percentage position of poi with id ${poi.uid}`)
				res.sendStatus(500)
				return
			}

			// TODO: isTurningPoint not implemented yet
			apiPois.push({type : type, pos: pos, percentagePosition: percentagePosition, isTurningPoint: false})
		}
		const ret: InitResponseApp = {
			trackId: currentTrack.uid,
			trackName: currentTrack.start + '-' + currentTrack.stop,
			trackLength: length,
			pointsOfInterest: apiPois
		}
		res.json(ret)
		return
	};


	/**
	 * This function is used to get a specific track for the website frontend.
	 * @param req The api request with a `trackId` in its request params.
	 * @param res A response with an InitResponseWebsite in its body if successful.
	 * @returns Nothing
	 */
	private getForTrackWebsite = async (req: Request, res: Response) => {
		const trackId: number = parseInt(req.params.trackId);

		const track: Track | null = await TrackService.getTrackById(trackId)
		if (!track) {
			logger.error(`Could not find track with id ${trackId}`)
			res.sendStatus(500)
			return
		}
		const path: GeoJSON.GeoJSON = await TrackService.getTrackAsLineString(track)
		const pois = await POIService.getAllPOIsForTrack(track)
		const apiPois: PointOfInterestWebsite[] = []
		for (const poi of pois) {
			// TODO: Map db poitype to api poitype
			const poiType: POIType | null = null //await POIService.getPOITypeById(poi.typeId)
			if (!poiType) {
				logger.error(`Could not determine type of poi with id ${poi.uid}`)
				res.sendStatus(500)
				return
			}
			const ppos: number | null = await POIService.getPOITrackDistancePercentage(poi)
			if (!ppos) {
				logger.error(`Could not determine percentage position of poi with id ${poi.uid}`)
				res.sendStatus(500)
				return
			}
			const position = poi.position
			// TODO: how to map from Prisma.JsonValue to position
			const apiPoi: PointOfInterestWebsite = {
				id: poi.uid,
				type: poiType == null ? POIType.None : poiType,
				name: poi.name,
				pos: { lat: 50, lng: 10 },
				isTurningPoint: true
			}
			apiPois.push(apiPoi)
		}

		const ret: InitResponseWebsite = {
			trackPath: path,
			pointsOfInterest: apiPois
		}
		res.json(ret)
		return
	}
}
