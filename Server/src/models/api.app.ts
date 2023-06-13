export interface Position {
    lat: number;
    lng: number;
}


export interface TrackListEntry {
    id: number;
    name: string; // human readable name
}

export interface InitRequest {
    pos: Position;
} 

export interface InitResponse {
    trackId: number; // Positive integer to uniquely identify track
    trackName: string; // E.g. "Malente-Lütjenburg"
    trackPath?: GeoJSON.GeoJSON;
    trackLength: number, // Total length of the track in meters
    pointsOfInterest: PointOfInterest[];
}

export enum POIType {
    None,
    LevelCrossing,
    LesserLevelCrossing,
    Picnic,
    TrackEnd,
}

export interface PointOfInterest {
    type: POIType;
    name?: string;
    pos: Position; // A gps position of the poi
    percentagePosition: number;  // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
    isTurningPoint: boolean; // Can a vehicle be turned at this poi?
}

export interface Vehicle {
    id: number; // A vehicle id 
    pos: Position; // The last known position
    percentagePosition: number // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
    headingTowardsUser: boolean; // Is the other vehicle heading towards the user?
}

export interface UpdateRequestWithLocationEnabled {
    vehicleId: number; // vehicle id of user
    pos: Position; // the current position of user
}

export interface UpdateResponseWithLocationEnabled {
    vehiclesNearUser: Vehicle[]; // Vehicles that should be marked on the map
    percentagePositionOnTrack: number; // Percentage (0-100) e.g. 0% Malente; 100% Lütjenburg
    passingPosition?: Position; // Only set if needed
}


export interface UpdateRequestWithLocationNotEnabled {
    vehicleId: number; // vehicle id of user
}

export interface UpdateResponseWithLocationNotEnabled {
    pos: Position; // The current position as measured by vehicle
    heading: number; // Heading of the vehicle between 0 and 359
    vehiclesNearUser: Vehicle[]; // Vehicles that should be marked on the map
    percentagePositionOnTrack: number; // Percentage (0-100) e.g. 0% Malente; 100% Lütjenburg
    passingPosition?: Position; // Only set if needed
}

