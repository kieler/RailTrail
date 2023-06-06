import { Request, Response, Router } from "express";
import { UpdateRequest, UpdateResponse, Vehicle } from "../models/api_types";

import { logger } from "../utils/logger";
import { authenticateJWT, jsonParser, v } from ".";
import { UpdateRequestSchema } from "../models/jsonschemas";

export class VehicleRoute {
  public static path: string = "/vehicles";
  private static instance: VehicleRoute;
  private router = Router();

  private constructor() {
    this.router.get("/:trackId", authenticateJWT, this.vehicles);
    this.router.put("", jsonParser, this.updateVehicle);
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
    const veh: Vehicle[] = [
      { id: 1, pos: { lat: 54.189157, lng: 10.592452 }, heading: 185 },
      { id: 2, pos: { lat: 54.195082, lng: 10.591109 }, heading: 190 },
    ];
    res.json(veh);
    return;
  };

  private updateVehicle = async (req: Request, res: Response) => {
    const userData: UpdateRequest = req.body;
    if (!userData || !v.validate(userData, UpdateRequestSchema).valid) {
      res.sendStatus(400);
      return;
    }

    //TODO: Call some service for processing

    //FIXME: This is only a stub
    const ret: UpdateResponse = {
      vehicleId: 1,
      vehiclesNearUser: [
        { id: 1, pos: { lat: 54.189157, lng: 10.592452 }, heading: 185 },
        { id: 2, pos: { lat: 54.195082, lng: 10.591109 }, heading: 190 },
      ],
      distanceTraveled: 10,
      distanceToNextCrossing: 0.1,
      distanceToNextVehicle: 1,
      passingPosition: { lat: 54.195082, lng: 10.591109 },
    };
    res.json(ret);
    return;
  };
}
