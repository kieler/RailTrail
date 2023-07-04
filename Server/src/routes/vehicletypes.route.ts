import { Request, Response, Router } from "express";
import {
	GetUidApp,
	PositionApp,
	ReturnUidApp,
	UpdateRequestWithLocationEnabledApp,
	UpdateRequestWithLocationNotEnabledApp,
	UpdateResponseWithLocationEnabledApp,
	UpdateResponseWithLocationNotEnabledApp,
	VehicleApp,
} from "../models/api.app";
import { PositionWebsite, VehicleCrUWebsite, VehicleListItemWebsite, VehicleWebsite } from "../models/api.website";
import { logger } from "../utils/logger";
import { authenticateJWT, jsonParser, v } from ".";
import {
	GetUidSchema,
	UpdateRequestWithLocationEnabledSchemaApp,
	UpdateRequestWithLocationNotEnabledSchemaApp,
} from "../models/jsonschemas.app";
import TrackService from "../services/track.service";
import { Track, Tracker, Vehicle, VehicleType } from "@prisma/client";
import VehicleService from "../services/vehicle.service";
import { Feature, GeoJsonProperties, Point } from "geojson";
import { VehicleCrUSchemaWebsite } from "../models/jsonschemas.website";
import TrackerService from "../services/tracker.service";

/**
 * The router class for the routing of the vehicle data to app and website.
 */
export class VehicleRoute {
	/** The path of this api route. */
	public static path: string = "/vehicletype";
	/** The sub router instance. */
	private static instance: VehicleRoute;
	/** The base router object. */
	private router = Router();

	/**
	 * The constructor to connect all of the routes with specific functions.
	 */
	private constructor() {
		this.router.get("/website", authenticateJWT, this.getTypeList)
        this.router.post("/website", authenticateJWT)
        this.router.delete("/website/:typeId", authenticateJWT)
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

	private getTypeList = async (req:Request, res: Response) => {
        
    }

    private updateType = async (req:Request, res: Response) => {
        
    }

    private deleteType = async (req:Request, res: Response) => {
        
    }

	
}
