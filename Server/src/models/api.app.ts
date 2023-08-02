import {Position, FullTrack, BareTrack, PointOfInterest, VehiclePos} from "./api";
import {GeoJSON} from "geojson";

// TODO: seperate the types
export type InitResponseApp = {
    trackId: number,
    trackName: string,
    trackPath?: GeoJSON,
    trackLength: number,
    pointsOfInterest: PointOfInterest[],
} // FullTrack & {pointsOfInterest: PointOfInterest[];};

export type TrackListEntryApp = BareTrack;

// TODO: simplify to just Position, without wrapping.
export type InitRequestApp = {pos: Position};


export enum POIType {
    None = 0,
    LevelCrossing = 1,
    LesserLevelCrossing = 2,
    Picnic = 3,
    TrackEnd = 4,
}


export interface UpdateRequestApp {
    vehicleId: number; // vehicle id of user
    pos?: Position; // the current position of user
}

export interface UpdateResponseApp {
    pos: Position; // The current position as measured by vehicle
    heading: number; // Heading of the vehicle between 0 and 359
    vehiclesNearUser: VehicleApp[]; // Vehicles that should be marked on the map
    percentagePositionOnTrack: number; // Percentage (0-100) e.g. 0% Malente; 100% Lütjenburg
    speed: number // Speed in km/h
    passingPosition?: Position; // Only set if needed
}

export interface GetUidApp {
    vehicleName : string // The name of 
}

export interface ReturnUidApp {
    vehicleId : number
}


//================ new

/**
 * A Vehicle with a position enriched with a percentage position
 * if it is heading towards a user.
 * TODO: replace with a specific API
 */
export interface VehicleApp extends VehiclePos {
    id: number,
    headingTowardsUser: boolean; // Is the other vehicle heading towards the user?
}