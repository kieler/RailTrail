import { Request, Response, Router } from "express";
import {
	UpdateRequestWithLocationEnabled,
	UpdateRequestWithLocationNotEnabled,
	UpdateResponseWithLocationEnabled,
	UpdateResponseWithLocationNotEnabled,
	Vehicle as VehicleApp,
} from "../models/api.app";
import { Vehicle as VehicleWebsite } from "../models/api.website";
import { logger } from "../utils/logger";
import { authenticateJWT, jsonParser, v } from ".";
import {
	UpdateRequestWithLocationEnabledSchema,
	UpdateRequestWithLocationNotEnabledSchema,
} from "../models/jsonschemas.app";
import { PositionSchema } from "../models/jsonschemas.website";

/**
 * The router class for the routing of the vehicle data to app and website.
 */
export class VehicleRoute {
	/** The path of this api route. */
	public static path: string = "/vehicles";
	/** The sub router instance. */
	private static instance: VehicleRoute;
	/** The base router object. */
	private router = Router();

	/**
	 * The constructor to connect all of the routes with specific functions.
	 */
	private constructor() {
		this.router.get("/app/:trackId", this.vehicles);
		this.router.put("/app/internalposition", jsonParser, this.updateVehicle);
		this.router.put(
			"/app/externalposition",
			jsonParser,
			this.updateVehicleExternal
		);
		this.router.get("/website/:trackId", authenticateJWT, this.getVehicleList);
	}

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!VehicleRoute.instance) {
			VehicleRoute.instance = new VehicleRoute();
		}
		return VehicleRoute.instance.router;
	}

	/**
	 * Gets all the vehicles with their positions on a specific track.
	 * @param req A request containing a track id in the parameters.
	 * @param res A reponse with a list of vehicles.
	 * @returns Nothing.
	 */
	private vehicles = async (req: Request, res: Response) => {
		const trackId: number = parseInt(req.params?.trackId);
		// TODO: Check if id valid
		logger.info(`Requested vehicles for track id: ${trackId}`);
		// TODO: Call appropriate service method

		// This should be deleted later on:
		const veh: VehicleApp[] = [
			{
				id: 1,
				pos: { lat: 54.189157, lng: 10.592452 },
				percentagePosition: 30,
				headingTowardsUser: false,
			},
			{
				id: 2,
				pos: { lat: 54.195082, lng: 10.591109 },
				percentagePosition: 70,
				headingTowardsUser: false,
			},
		];
		res.json(veh);
		return;
	};

	/**
	 * Updates location of app and gets some present information for the app. (vehicles near user etc.)
	 * @param req An UpdateRequestWithLocationEnabled in the body.
	 * @param res An UpdateResponseWithLocationEnabled with the useful information.
	 * @returns Nothing.
	 */
	private updateVehicle = async (req: Request, res: Response) => {
		const userData: UpdateRequestWithLocationEnabled = req.body;
		v.addSchema(PositionSchema, "Position");
		if (
			!userData //|| !v.validate(userData, UpdateRequestWithLocationEnabledSchema).valid
		) {
			res.sendStatus(400);
			return;
		}

		//TODO: Call some service for processing

		//FIXME: This is only a stub
		const ret: UpdateResponseWithLocationEnabled = {
			vehiclesNearUser: [
				{
					id: 1,
					pos: { lat: 54.189157, lng: 10.592452 },
					percentagePosition: 50,
					headingTowardsUser: false,
				},
				{
					id: 2,
					pos: { lat: 54.195082, lng: 10.591109 },
					percentagePosition: 51,
					headingTowardsUser: false,
				},
			],
			percentagePositionOnTrack: 100,
			passingPosition: { lat: 54.195082, lng: 10.591109 },
		};
		res.json(ret);
		return;
	};

	/**
	 * Updates the vehicle with information from app without location enabled. 
	 * @param req A request containing a UpdateRequestWithLocationNotEnabled within its body.
	 * @param res An UpdateResponseWithLocationNotEnabled with some information for the app.
	 * @returns Nothing.
	 */
	private updateVehicleExternal = async (req: Request, res: Response) => {
		const userData: UpdateRequestWithLocationNotEnabled = req.body;
		if (
			!userData //|| !v.validate(userData, UpdateRequestWithLocationNotEnabledSchema).valid
		) {
			res.sendStatus(400);
			return;
		}

		//FIXME: This is only a stub
		const ret: UpdateResponseWithLocationNotEnabled = {
			pos: { lat: 54.189157, lng: 10.592452 },
			heading: 100,
			vehiclesNearUser: [
				{
					id: 1,
					pos: { lat: 54.189157, lng: 10.592452 },
					percentagePosition: 50,
					headingTowardsUser: false,
				},
				{
					id: 2,
					pos: { lat: 54.195082, lng: 10.591109 },
					percentagePosition: 51,
					headingTowardsUser: false,
				},
			],
			percentagePositionOnTrack: 100,
			passingPosition: { lat: 54.195082, lng: 10.591109 },
		};
		res.json(ret);
		return;
	};

	/**
	 * Gets a list of the vehicles for the website containing their current information. 
	 * @param req A request containing no special information.
	 * @param res A response containing a `VehicleWebsite[]`
	 * @returns Nothing.
	 */
	private getVehicleList = async (req: Request, res: Response) => {
		//FIXME: This is only a stub
		const ret: VehicleWebsite[] = [
			{
				id: 1,
				name: "Draisine 1",
				pos: { lat: 54.189157, lng: 10.592452 },
				heading: 100,
				batteryLevel: 90,
			},
			{
				id: 2,
				name: "Draisine 2",
				pos: { lat: 54.189157, lng: 10.592452 },
				heading: 190,
				batteryLevel: 80,
			},
		];
		res.json(ret);
		return;
	};
}
