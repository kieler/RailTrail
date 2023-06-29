import { FeatureCollection, GeoJsonProperties, Point } from "geojson";

export interface AuthenticationRequestWebsite {
    username: string; // The username that was entered into the login-form
    password: string; // The password that was entered into the login-form
}

export interface AuthenticationResponseWebsite {
    token: string;    // A jwt session token
}

export interface TrackListEntryWebsite {
    id: number;
    name: string;     // human readable name
}

export interface InitResponseWebsite {
    trackPath: GeoJSON.GeoJSON;   // A geojson containing the tracks points.
    pointsOfInterest: PointOfInterestWebsite[];
}

export interface PointOfInterestWebsite {
    id: number;
    type: POIType;
    name?: string;
    pos: PositionWebsite;                // The position of the POI
    isTurningPoint: boolean;      // Can the POI be used to turn a vehicle?
}

export interface UpdateAddPOIWebsite {
    id?: number;
    type: POIType;
    name?: string;
    pos: PositionWebsite;                // The position of the POI
    isTurningPoint: boolean;      // Can the POI be used to turn a vehicle?
}

export enum POIType {
    None,
    LevelCrossing,
    LesserLevelCrossing,
    Picnic,
    TrackEnd,
}

export interface PositionWebsite {
    lat: number;
    lng: number;
}

export interface VehicleWebsite {
    id: number;
    name: string;
    pos: PositionWebsite;
    heading?: number;     // between 0 and 360
    batteryLevel: number;  // A percentage value between 0% and 100%
}

export interface PasswordChangeWebsite {
    oldPassword: string
    newPassword: string
}

export interface UserListWebsite {
    users: UserWebsite[];
}

export interface UserWebsite {
    id: number;
    username: string;
}

export interface TrackPathWebsite {
    start: string, 
    end: string,
    path: FeatureCollection<Point, GeoJsonProperties>; // The track as a geojson
}
