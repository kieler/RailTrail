export interface PositionApp {
    lat: number;
    lng: number;
}


export interface TrackListEntryApp {
    id: number;
    name: string; // human readable name
}

export interface InitRequestApp {
    pos: PositionApp;
} 

export interface InitResponseApp {
    trackId: number; // Positive integer to uniquely identify track
    trackName: string; // E.g. "Malente-Lütjenburg"
    trackPath?: GeoJSON.GeoJSON;
    trackLength: number, // Total length of the track in meters
    pointsOfInterest: PointOfInterestApp[];
}

export enum POIType {
    None,
    LevelCrossing,
    LesserLevelCrossing,
    Picnic,
    TrackEnd,
}

export interface PointOfInterestApp {
    type: POIType;
    name?: string;
    pos: PositionApp; // A gps position of the poi
    percentagePosition: number;  // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
    isTurningPoint: boolean; // Can a vehicle be turned at this poi?
}

export interface VehicleApp {
    id: number; // A vehicle id 
    pos: PositionApp; // The last known position
    percentagePosition: number // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
    headingTowardsUser: boolean; // Is the other vehicle heading towards the user?
}

export interface UpdateRequestWithLocationEnabledApp {
    vehicleId: number; // vehicle id of user
    pos: PositionApp; // the current position of user
}

export interface UpdateResponseWithLocationEnabledApp {
    vehiclesNearUser: VehicleApp[]; // Vehicles that should be marked on the map
    percentagePositionOnTrack: number; // Percentage (0-100) e.g. 0% Malente; 100% Lütjenburg
    passingPosition?: PositionApp; // Only set if needed
}


export interface UpdateRequestWithLocationNotEnabledApp {
    vehicleId: number; // vehicle id of user
}

export interface UpdateResponseWithLocationNotEnabledApp {
    pos: PositionApp; // The current position as measured by vehicle
    heading: number; // Heading of the vehicle between 0 and 359
    vehiclesNearUser: VehicleApp[]; // Vehicles that should be marked on the map
    percentagePositionOnTrack: number; // Percentage (0-100) e.g. 0% Malente; 100% Lütjenburg
    passingPosition?: PositionApp; // Only set if needed
}

export interface GetUid {
    vehicleName : string
}

export interface ReturnUid {
    vehicleId : number
}