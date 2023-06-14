import { Request, Response, Router } from "express";
import {
	UpdateRequestWithLocationEnabled, UpdateRequestWithLocationNotEnabled,
	UpdateResponseWithLocationEnabled, UpdateResponseWithLocationNotEnabled, Vehicle as VehicleApp
} from "../models/api.app";
import { Vehicle as VehicleWebsite } from "../models/api.website";
import { logger } from "../utils/logger";
import { authenticateJWT, jsonParser, v } from ".";
import { UpdateRequestWithLocationEnabledSchema, UpdateRequestWithLocationNotEnabledSchema } from "../models/jsonschemas.app";
import { PositionSchema } from "../models/jsonschemas.website";

export class VehicleRoute {
	public static path: string = "/vehicles";
	private static instance: VehicleRoute;
	private router = Router();

	private constructor() {
		this.router.get("/:trackId", this.vehicles)
		this.router.put("/internalposition", jsonParser, this.updateVehicle)
		this.router.put('/externalposition', jsonParser, this.updateVehicleExternal)
		this.router.get('/website/:trackId', authenticateJWT, this.getVehicleList)
	}

	static get router() {
		if (!VehicleRoute.instance) {
			VehicleRoute.instance = new VehicleRoute();
		}
		return VehicleRoute.instance.router;
	}

	private vehicles = async (req: Request, res: Response) => {
		const trackId: number = parseInt(req.params?.trackId);
		logger.info(`Requested vehicles for track id: ${trackId}`);
		// TODO: Call appropriate service method

		// This should be deleted later on:
		const veh: VehicleApp[] = [
			{ id: 1, pos: { lat: 54.189157, lng: 10.592452 }, percentagePosition: 30, headingTowardsUser: false },
			{ id: 2, pos: { lat: 54.195082, lng: 10.591109 }, percentagePosition: 70, headingTowardsUser: false },
		];
		res.json(veh);
		return;
	};

	private updateVehicle = async (req: Request, res: Response) => {
		const userData: UpdateRequestWithLocationEnabled = req.body
		v.addSchema(PositionSchema, 'Position')
		if (!userData //|| !v.validate(userData, UpdateRequestWithLocationEnabledSchema).valid
		) {
			res.sendStatus(400)
			return
		}

		//TODO: Call some service for processing

		//FIXME: This is only a stub
		const ret: UpdateResponseWithLocationEnabled = {
			vehiclesNearUser: [
				{ id: 1, pos: { lat: 54.189157, lng: 10.592452 }, percentagePosition: 50, headingTowardsUser: false },
				{ id: 2, pos: { lat: 54.195082, lng: 10.591109 }, percentagePosition: 51, headingTowardsUser: false },
			],
			percentagePositionOnTrack: 100,
			passingPosition: { lat: 54.195082, lng: 10.591109 },
		};
		res.json(ret);
		return;
	};

	private updateVehicleExternal = async (req: Request, res: Response) => {
		const userData: UpdateRequestWithLocationNotEnabled = req.body
		if (!userData //|| !v.validate(userData, UpdateRequestWithLocationNotEnabledSchema).valid
		) {
			res.sendStatus(400)
			return
		}

		//FIXME: This is only a stub
		const ret: UpdateResponseWithLocationNotEnabled = {
			pos: { lat: 54.189157, lng: 10.592452 },
			heading: 100,
			vehiclesNearUser: [
				{ id: 1, pos: { lat: 54.189157, lng: 10.592452 }, percentagePosition: 50, headingTowardsUser: false },
				{ id: 2, pos: { lat: 54.195082, lng: 10.591109 }, percentagePosition: 51, headingTowardsUser: false },
			],
			percentagePositionOnTrack: 100,
			passingPosition: { lat: 54.195082, lng: 10.591109 },
		};
		res.json(ret);
		return;
	}
	private getVehicleList = async (req: Request, res: Response) => {
		//FIXME: This is only a stub
		const ret: VehicleWebsite[] = [
			{
				id: 1,
				name: "Draisine 1",
				pos: { lat: 54.189157, lng: 10.592452 },
				heading: 100,
				batteryLevel: 90
			},
			{
				id: 2,
				name: "Draisine 2",
				pos: { lat: 54.189157, lng: 10.592452 },
				heading: 190,
				batteryLevel: 80
			}
		]
		res.json(ret)
		return
	}
}
