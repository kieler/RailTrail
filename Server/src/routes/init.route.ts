import { Request, Response, Router } from "express";
import { authenticateJWT } from ".";
import { InitResponse, Position, POIType, TrackListEntry, InitRequest } from "../models/api.app";
import { InitResponse as InitResponseWebsite, PointOfInterest as POIWebsite } from "../models/api.website";
import { logger } from "../utils/logger";
import { jsonParser, v } from ".";
import { PositionSchema } from "../models/jsonschemas.app";

export class InitRoute {
	public static path: string = "/init";
	private static instance: InitRoute;
	private router = Router();

	private constructor() {
		this.router.get('/track/:trackId', jsonParser, this.getForTrack);
		this.router.get('/tracks', this.getAllTracks);
		this.router.put('', jsonParser, this.getTrackByPosition);

		this.router.get('/website', authenticateJWT, jsonParser, this.getAllTracks);
		this.router.get('/website/:trackId', authenticateJWT, jsonParser, this.getForTrackWebsite);
	}

	static get router() {
		if (!InitRoute.instance) {
			InitRoute.instance = new InitRoute();
		}
		return InitRoute.instance.router;
	}

	private getForTrack = async (req: Request, res: Response) => {
		const trackId: number = parseInt(req.params.trackId);
		const username: string = req.params.username;
		logger.info(
			`Got init request for track ${trackId} and user with username ${username}`
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


	private getForTrackWebsite = async (req: Request, res: Response) => {
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
