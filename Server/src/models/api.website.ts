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
    None,
    LevelCrossing,
    LesserLevelCrossing,
    Picnic,
    TrackEnd,
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

export interface TrackMetaData {
    trackName: string;  // E.g. Malente-Lütjenburg
}

export interface TrackMetaDataResponse {
    uploadId: number;   // A unique id for uploading a geojson
}

export interface TrackPath {
    uploadId: number;   
    path: GeoJSON.GeoJSON; // The track as a geojson
}
