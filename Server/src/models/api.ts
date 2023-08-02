import {POIType} from "./api.app";

export interface Position {
    lat: number;
    lng: number;
}

/**
 * Condensed Information about a Track.
 * Suitable, for example, to build a track selection interface
 */
export interface BareTrack {
    id: number; // Positive integer to uniquely identify track
    name: string; // E.g. "Malente-Lütjenburg"
}

/**
 * Complete information about a track. For display on a map or similar things.
 */
export interface FullTrack extends BareTrack {
    path: GeoJSON.GeoJSON;
    length: number, // Total length of the track in meters
}

export type TrackList = BareTrack[];

/**
 * A POI as returned by the backend, enriched with a percentage position.
 */
export interface PointOfInterest extends UpdatePointOfInterest {
    id: number;
    percentagePosition: number;  // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
}

/**
 * The payload used to update/create a poi using the CRUD api
 */
export interface UpdatePointOfInterest {
    id?: number;
    type: POIType;
    name: string;
    description?: string;
    pos: Position; // A gps position of the poi
    isTurningPoint: boolean; // Can a vehicle be turned at this poi?
}

/** The basic information shared by all vehicle representations */
export interface UpdateVehicle {
    id?: number;
    name: string;
    type: number;
    trackerIds: string[]
}

/**
 * The payload used to create/update a vehicle using the CRUD api.
 */

/**
 * The vehicle with a position that might be known.
 */
export interface VehiclePos extends UpdateVehicle {
    id: number;
    pos?: Position;       // undefined if position is unknown.
    percentagePosition?: number // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
    heading?: number;     // between 0 and 360
}

/**
 * The Payload type used to update/create a vehicle type with the CRUD api
 */
export interface UpdateVehicleType {
    id?: number, // Null, if creating vehicle type, some other value otherwise
    name: string, // A descriptive name of the vehicle type, e.g. "Draisine", "High-Speed Train",..
    description?: string // Perhaps a description of the type of vehicle, that is falls into this category
}

/**
 * A representation of a vehicle type
 */
export interface VehicleType extends UpdateVehicleType {
    id: number;
}