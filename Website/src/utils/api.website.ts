import { FeatureCollection, GeoJsonProperties, Point } from "geojson";

export interface AuthenticationRequest {
    username: string; // The username that was entered into the login-form
    password: string; // The password that was entered into the login-form
}

export interface AuthenticationResponse {
    token: string;    // A jwt session token
}


export interface TrackListEntry {
    id: number;
    name: string;     // human readable name
}

export interface InitResponse {
    trackPath: GeoJSON.GeoJSON;   // A geojson containing the tracks points.
    pointsOfInterest: PointOfInterest[];
}

export interface PointOfInterest {
    id: number;
    type: POIType;
    name?: string;
    pos: Position;                // The position of the POI
    isTurningPoint: boolean;      // Can the POI be used to turn a vehicle?
}

export interface UpdateAddPOI {
    id?: number;
    type: POIType;
    name?: string;
    pos: Position;                // The position of the POI
    isTurningPoint: boolean;      // Can the POI be used to turn a vehicle?
}

export enum POIType {
    None = 0,
    LevelCrossing = 1,
    LesserLevelCrossing = 2,
    Picnic = 3,
    TrackEnd = 4,
}

export interface Position {
    lat: number;
    lng: number;
}

export interface Vehicle {
    id: number;
    name: string;
    pos: Position;
    heading?: number;     // between 0 and 360
    batteryLevel: number;  // A percentage value between 0% and 100%
}

export interface PasswordChange {
    oldPassword: string
    newPassword: string
}

export interface UserList {
    users: User[];
}

export interface User {
    id: number;
    username: string;
}

export interface TrackPath {
    start: string,
    end: string,
    path: FeatureCollection<Point, GeoJsonProperties>; // The track as a geojson
}

export interface VehicleListItem {
    uid: number, // Uid of the vehicle
    name: string, // The name, that is attached to the vehicle, e.g. "1" for "Draisine 1"
    typeId: number, // The id of the type
    trackerIds?: string[] // A unique id to identify the tracker belonging to that vehicle
}

export interface VehicleCrU {
    uid?: number, // Null, if creating vehicle, some other value otherwise
    name: string, // The name, that is attached to the vehicle, e.g. "1" for "Draisine 1"
    typeId: number, // The id of the type
    trackerIds: string[]// A unique id to identify the tracker belonging to that vehicle
}

export interface VehicleTypeListItem {
    uid: number, // A unique id of a vehicle type
    name: string, // A descriptive name of the vehicle type, e.g. "Draisine", "High-Speed Train",..
    description?: string // Perhaps a description of the type of vehicle, that is falls into this category
}

export interface VehicleTypeCrU {
    uid?: number, // Null, if creating vehicle type, some other value otherwise
    name: string, // A descriptive name of the vehicle type, e.g. "Draisine", "High-Speed Train",..
    description?: string // Perhaps a description of the type of vehicle, that is falls into this category
}

export type TrackList = TrackListEntry[];
export type VehicleList = VehicleListItem[];
export type VehicleTypeList = VehicleTypeListItem[];
