import { Request, Response, Router } from "express";
import {
	PositionApp,
	UpdateRequestWithLocationEnabledApp,
	UpdateRequestWithLocationNotEnabledApp,
	UpdateResponseWithLocationEnabledApp,
	UpdateResponseWithLocationNotEnabledApp,
	VehicleApp,
} from "../models/api.app";
import { PositionWebsite, VehicleWebsite } from "../models/api.website";
import { logger } from "../utils/logger";
import { authenticateJWT, jsonParser, v } from ".";
import {
	UpdateRequestWithLocationEnabledSchemaApp,
	UpdateRequestWithLocationNotEnabledSchemaApp,
} from "../models/jsonschemas.app";
import { PositionSchemaWebsite } from "../models/jsonschemas.website";
import TrackService from "../services/track.service";
import { Track, Vehicle } from "@prisma/client";
import VehicleService from "../services/vehicle.service";
import { Feature, GeoJsonProperties, Point } from "geojson";

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
	 * Updates location of app and gets some present information for the app. (vehicles near user etc.)
	 * @param req An UpdateRequestWithLocationEnabled in the body.
	 * @param res An UpdateResponseWithLocationEnabled with the useful information.
	 * @returns Nothing.
	 */
	private updateVehicle = async (req: Request, res: Response) => {
		const userData: UpdateRequestWithLocationEnabledApp = req.body;
		if (
			!userData || !v.validate(userData, UpdateRequestWithLocationEnabledSchemaApp).valid
		) {
			res.sendStatus(400);
			return;
		}

		// TODO: Vehicle position of app user not implemented in db yet
		const ret: UpdateResponseWithLocationEnabledApp = {
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
		const userData: UpdateRequestWithLocationNotEnabledApp = req.body;
		if (
			!userData || !v.validate(userData, UpdateRequestWithLocationNotEnabledSchemaApp).valid
		) {
			res.sendStatus(400);
			return;
		}

		const userVehicle: Vehicle | null = await VehicleService.getVehicleById(userData.vehicleId)
		if (!userVehicle) {
			logger.error(`Could not find vehicle with id ${userData.vehicleId}`)
			res.sendStatus(500)
			return
		}
		const pos: Feature<Point, GeoJsonProperties> | null = await VehicleService.getVehiclePosition(userVehicle)
		if (!pos) {
			logger.error(`Could not find position of vehicle with id ${userVehicle.uid}`)
			res.sendStatus(500)
			return
		}
		const position: PositionApp = { lat: pos.geometry.coordinates[0], lng: pos.geometry.coordinates[1] }
		const heading: number = await VehicleService.getVehicleHeading(userVehicle)
		const nearbys: Vehicle[] | null = await VehicleService.getNearbyVehicles(userVehicle)
		const list: VehicleApp[] = []
		if (nearbys) {
			for (const nearby of nearbys) {
				const po: Feature<Point, GeoJsonProperties> | null = await VehicleService.getVehiclePosition(nearby)
				const percentage: number | null = await VehicleService.getVehicleTrackDistancePercentage(nearby)
				const ve: VehicleApp = {
					id: nearby.uid,
					pos: {
						lat: po?.geometry.coordinates[0] ? po?.geometry.coordinates[0] : 0,
						lng: po?.geometry.coordinates[1] ? po?.geometry.coordinates[1] : 0
					},
					percentagePosition: percentage ? percentage : 0,
					headingTowardsUser: false // FIXME: Needs to be changed
				}
				list.push(ve)
			}
		}
		const percentagePositionOnTrack: number | null = await VehicleService.getVehicleTrackDistancePercentage(userVehicle)
		if (!percentagePositionOnTrack) {
			logger.error(`Could not determine percentage position on track for vehicle with id ${userVehicle.uid}`)
			res.sendStatus(500)
			return
		}
		const ret: UpdateResponseWithLocationNotEnabledApp = {
			pos: position,
			heading: heading,
			vehiclesNearUser: list,
			percentagePositionOnTrack: percentagePositionOnTrack
		}
		res.json(ret)
		return
	};

	/**
	 * Gets a list of the vehicles for the website containing their current information. 
	 * @param req A request containing no special information.
	 * @param res A response containing a `VehicleWebsite[]`
	 * @returns Nothing.
	 */
	private getVehicleList = async (req: Request, res: Response) => {
		const trackId : number = parseInt(req.params.trackId)
		const track : Track | null = await  TrackService.getTrackById(trackId)
		if (!track) {
			logger.error(`Could not find track with id ${trackId}`)
			res.sendStatus(500)
			return
		}
		const vehicles: Vehicle[] = await VehicleService.getAllVehiclesForTrack(track)
		const ret: VehicleWebsite[] = []
		for (const vehicle of vehicles) {
			const pos:  Feature<Point, GeoJsonProperties> | null = await VehicleService.getVehiclePosition(vehicle)
			if (!pos) {
				logger.error(`Could not find position of vehicle with id ${vehicle.uid}`)
				res.sendStatus(500)
				return
			}
			const actualPos : PositionWebsite = {lat : pos.geometry.coordinates[0], lng: pos.geometry.coordinates[1]}
			const heading: number | null = await VehicleService.getVehicleHeading(vehicle)
			if (!heading) {
				logger.error(`Could not find heading of vehicle with id ${vehicle.uid}`)
				res.sendStatus(500)
				return
			}
			const veh: VehicleWebsite = {
				id : vehicle.uid,
				name : vehicle.name ? vehicle.name : "Vehicle" + vehicle.uid, 
				pos: actualPos,
				heading: heading,
				batteryLevel: 100 // TODO: Wait for implementation
			}
			ret.push(veh)
		}
		res.json(ret);
		return;
	};
}
