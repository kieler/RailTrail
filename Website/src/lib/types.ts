import { LatLngExpression } from "leaflet"
import { Vehicle } from "./api.website"

export interface IMapConfig {
  position: LatLngExpression,
  zoom_level: number,
  server_vehicles: Vehicle[]
}

export interface IMapRefreshConfig extends IMapConfig {
  track_id: number
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