import { Request, Response, Router } from "express";
import { authenticateJWT } from ".";
import {
  InitResponse,
  POIType,
  TrackListEntry,
  InitRequest,
  Position,
} from "../models/api_types";
import { logger } from "../utils/logger";
import { jsonParser } from ".";

export class InitRoute {
  public static path: string = "/init";
  private static instance: InitRoute;
  private router = Router();

  private constructor() {
    this.router.get("/track/:trackId", authenticateJWT, jsonParser, this.getForTrack);
    // Probably needs auth as well
    this.router.get("/tracks", this.getAllTracks);
    this.router.put('',jsonParser, this.getTrackByPosition);
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
      trackStart: "Bhf Malente",
      trackEnd: "Bhf Lütjenburg",
      pointsOfInterest: [
        {
          type: POIType.LevelCrossing,
          pos: { lat: 54.19835, lng: 10.597014 },
          isTurningPoint: true,
        },
        {
          type: POIType.TrackEnd,
          pos: { lat: 54.292784, lng: 10.601542 },
          isTurningPoint: true,
        },
      ],
    };
    res.json(ret);
  };

  private getAllTracks = async (req: Request, res: Response) => {
    //TODO: Call some service for processing
    //FIXME: This is only a stub
    const ret: TrackListEntry[] = [
      { id: 1, name: "Malente-Lütjenburg" },
      { id: 2, name: "Malente-Kiel" },
    ];
    res.json(ret);
  };

  private getTrackByPosition = async (req: Request, res: Response) => {
    const posWrapper: InitRequest = req.body;    
    const pos: Position = posWrapper?.pos;

    //TODO: Call some service for processing
    //FIXME: This is only a stub
    const ret: InitResponse = {
      trackId: 1,
      trackName: "Malente-Lütjenburg",
      trackStart: "Bhf Malente",
      trackEnd: "Bhf Lütjenburg",
      pointsOfInterest: [
        {
          type: POIType.LevelCrossing,
          pos: { lat: 54.19835, lng: 10.597014 },
          isTurningPoint: true,
        },
        {
          type: POIType.TrackEnd,
          pos: { lat: 54.292784, lng: 10.601542 },
          isTurningPoint: true,
        },
      ],
    };
    res.json(ret);
  };
}
