import { LatLngExpression } from "leaflet";
import { FullTrack, PointOfInterest, POIType, Vehicle } from "./api";
import { JSX } from "react";

export interface IMapConfig {
	position: LatLngExpression;
	zoom_level: number;
	server_vehicles: Vehicle[];
	track_data?: FullTrack;
	points_of_interest: PointOfInterest[];
	poi_types: POIType[];
	focus?: number;
}

export interface IMapRefreshConfig extends IMapConfig {
	track_id: number;
	logged_in?: boolean;
	setLogin?: (success: boolean) => void;
}

export class UnauthorizedError extends Error {
	public name = "UnauthorizedError";
}

export class RevalidateError extends Error {
	private readonly _statusCode: number;

	constructor(message: string, statusCode: number, options?: ErrorOptions) {
		super(message, options);
		this._statusCode = statusCode;
	}

	get statusCode(): number {
		return this._statusCode;
	}
}

export type Option<V> = { value: V; label: string | JSX.Element };
