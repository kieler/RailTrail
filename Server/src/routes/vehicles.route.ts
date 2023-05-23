import { Request, Response, Router } from "express";
import { Vehicle } from "../models/api_types";

import { logger } from "../utils/logger";
import { authenticateJWT } from ".";

export class VehicleRoute {
  public static path: string = "/vehicles";
  private static instance: VehicleRoute;
  private router = Router();

  private constructor() {
    // TODO: Insert auth
    this.router.get("/:trackId", authenticateJWT, this.vehicles);
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
}
