import { LatLngExpression } from "leaflet";
import { FullTrack, PointOfInterest, POIType, Vehicle } from "./api";
import { Dispatch, JSX, SetStateAction } from "react";

export interface MapConfig {
	initial_position: LatLngExpression;
	initial_zoom_level: number;
	vehicles: Vehicle[];
	track_data?: FullTrack;
	points_of_interest: PointOfInterest[];
	poi_types: POIType[];
	focus?: number;
	setFocus: Dispatch<SetStateAction<number | undefined>>;
}

export interface MapRefreshConfig extends Omit<MapConfig, "setFocus" | "focus" | "vehicles"> {
	track_id: number;
	logged_in?: boolean;
	setLogin?: (success: boolean) => void;
	initial_focus?: number;
	server_vehicles: Vehicle[];
}

/**
 * Specific error subclass that is thrown for 401 backend responses
 */
export class UnauthorizedError extends Error {
	public name = "UnauthorizedError";
}

/**
 * An error subclass that is thrown whenever re-fetching fails.
 */
export class RevalidateError extends Error {
	private readonly _statusCode: number;

	/**
	 * Construct a revalidate Error
	 * @param message		The error message
	 * @param statusCode	The response status code that caused this error
	 * @param options		Other error options
	 */
	constructor(message: string, statusCode: number, options?: ErrorOptions) {
		super(message, options);
		this._statusCode = statusCode;
	}

	/**
	 * Getter for the status code.
	 */
	get statusCode(): number {
		return this._statusCode;
	}
}

export type Option<V> = { value: V; label: string | JSX.Element };
