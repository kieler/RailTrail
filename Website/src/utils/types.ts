import { LatLngExpression } from "leaflet"
import {FullTrack, PointOfInterest, Vehicle} from "./api"

export interface IMapConfig {
  position: LatLngExpression,
  zoom_level: number,
  server_vehicles: Vehicle[],
  track_data?: FullTrack,
  points_of_interest: PointOfInterest[],
  focus?: number
}

export interface IMapRefreshConfig extends IMapConfig {
  track_id: number
  logged_in?: boolean,
  setLogin?: (success: boolean) => void
}

export class UnauthorizedError extends Error {}

export class RevalidateError extends Error {
  private _statusCode: number;

  constructor(message: string, statusCode: number, options?: ErrorOptions) {
    super(message, options);
    this._statusCode = statusCode;
  }

  get statusCode(): number {
    return this._statusCode;
  }

}