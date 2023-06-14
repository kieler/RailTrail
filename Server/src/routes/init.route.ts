import { Request, Response, Router } from "express";
import { authenticateJWT } from ".";
import { InitResponse, Position, POIType, TrackListEntry, InitRequest } from "../models/api.app";
import { InitResponse as InitResponseWebsite, PointOfInterest as POIWebsite } from "../models/api.website";
import { logger } from "../utils/logger";
import { jsonParser, v } from ".";
import { PositionSchema } from "../models/jsonschemas.app";

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
		this.router.get('/app/track/:trackId', jsonParser, this.getForTrack);
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
		const trackId: number = parseInt(req.params.trackId);
		logger.info(
			`Got init request for track ${trackId}`
		);

		//TODO: Call some service for processing
		//FIXME: This is only a stub
		const ret: InitResponse = {
			trackId: 1,
			trackName: "Malente-Lütjenburg",
			trackLength: 17000,
			pointsOfInterest: [
				{
					type: POIType.LevelCrossing,
					pos: { lat: 54.19835, lng: 10.597014 },
					percentagePosition: 50,
					isTurningPoint: true,
				},
				{
					type: POIType.TrackEnd,
					pos: { lat: 54.292784, lng: 10.601542 },
					percentagePosition: 100,
					isTurningPoint: true,
				},
			],
		};
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
		//TODO: Call some service for processing
		//FIXME: This is only a stub
		const ret: TrackListEntry[] = [
			{ id: 1, name: "Malente-Lütjenburg" },
			{ id: 2, name: "Malente-Kiel" },
		];
		res.json(ret);
		return;
	};

	/**
	 * This function is used to find a specific track determined by a position.
	 * 
	 * @param req The request that should contain a valid InitRequest in its body. 
	 * @param res A response with a InitResponse in its body if successful.
	 * @returns Nothing
	 */
	private getTrackByPosition = async (req: Request, res: Response) => {
		const posWrapper: InitRequest = req.body;
		const pos: Position = posWrapper?.pos;
		if (!pos //|| !v.validate(pos, PositionSchema).valid
		) {
			res.sendStatus(400);
			return;
		}

		//TODO: Call some service for processing
		//FIXME: This is only a stub
		const ret: InitResponse = {
			trackId: 1,
			trackName: "Malente-Lütjenburg",
			trackLength: 17000,
			pointsOfInterest: [
				{
					type: POIType.LevelCrossing,
					pos: { lat: 54.19835, lng: 10.597014 },
					percentagePosition: 50,
					isTurningPoint: true,
				},
				{
					type: POIType.TrackEnd,
					pos: { lat: 54.292784, lng: 10.601542 },
					percentagePosition: 70,
					isTurningPoint: true,
				},
			],
		};
		res.json(ret);
		return;
	};


	/**
	 * This function is used to get a specific track for the website frontend.
	 * @param req The api request with a `trackId` in its request params.
	 * @param res A response with an InitResponseWebsite in its body if successful.
	 * @returns Nothing
	 */
	private getForTrackWebsite = async (req: Request, res: Response) => {
		const trackId: number = parseInt(req.params.trackId);

		//TODO: Call some service for processing
		//FIXME: This is only a stub
		const ret: InitResponseWebsite = {
			trackPath: {
				"type": "MultiLineString",
				"coordinates": [
					[[10, 10], [20, 20], [10, 40]],
					[[40, 40], [30, 30], [40, 20], [30, 10]]
				]
			},
			pointsOfInterest: [
				{
					id: 1,
					type: POIType.LevelCrossing,
					pos: { lat: 54.19835, lng: 10.597014 },
					isTurningPoint: true,
				},
				{
					id: 2,
					type: POIType.TrackEnd,
					pos: { lat: 54.292784, lng: 10.601542 },
					isTurningPoint: true,
				},
			],

		}
		res.json(ret);
		return;
	}
}
