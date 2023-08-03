import { FeatureCollection, GeoJsonProperties, Point } from "geojson";
import {FullTrack, PointOfInterest, UpdateVehicle, Vehicle} from "./api";

export interface AuthenticationRequest {
    username: string; // The username that was entered into the login-form
    password: string; // The password that was entered into the login-form
}

export interface AuthenticationResponse {
    token: string;    // A jwt session token
}

export interface PasswordChangeRequest {
    oldPassword: string
    newPassword: string
}

export interface User {
    id: number;
    username: string;
}

export interface AddTrackRequest {
    start: string,
    end: string,
    path: FeatureCollection<Point, GeoJsonProperties>; // The track as a geojson
}

export type InitResponseWebsite = FullTrack;
// {
//     trackPath: GeoJSON.GeoJSON;   // A geojson containing the tracks points.
//     trackName: string;            // the same human readable name as in the track list.
//     pointsOfInterest: PointOfInterestWebsite[];
// }

export type PointOfInterestWebsite = PointOfInterest;
// {
//     id: number;
//     type: POIType;
//     name?: string;
//     pos: PositionWebsite;                // The position of the POI
//     isTurningPoint: boolean;      // Can the POI be used to turn a vehicle?
// }

// export interface UpdateAddPOIWebsite {
//     id?: number;
//     type: POIType;
//     name?: string;
//     pos: PositionWebsite;                // The position of the POI
//     isTurningPoint: boolean;      // Can the POI be used to turn a vehicle?
// }

export enum POIType {
    None = 0,
    LevelCrossing = 1,
    LesserLevelCrossing = 2,
    Picnic = 3,
    TrackEnd = 4,
}

// export interface PositionWebsite {
//     lat: number;
//     lng: number;
// }

// export interface VehicleWebsite {
//     id: number;
//     name: string;
//     type: number; // the vehicle type. Used together with the VehicleTypeList, this could, for example, be used to display different markers.
//     pos: PositionWebsite;
//     heading?: number;     // between 0 and 360
//     batteryLevel: number;  // A percentage value between 0% and 100%
// }



// export interface VehicleListItemWebsite {
//     uid: number, // Uid of the vehicle
//     name: string, // The name, that is attached to the vehicle, e.g. "1" for "Draisine 1"
//     typeId: number, // The id of the type
//     trackerIds: string[] // A unique id to identify the tracker belonging to that vehicle
// }
//
// export interface VehicleCrUWebsite {
//     uid?: number, // Null, if creating vehicle, some other value otherwise
//     name: string, // The name, that is attached to the vehicle, e.g. "1" for "Draisine 1"
//     typeId: number, // The id of the type
//     trackerIds: string[]// A unique id to identify the tracker belonging to that vehicle
// }

// export interface VehicleTypeListItemWebsite {
//     uid: number, // A unique id of a vehicle type
//     name: string, // A descriptive name of the vehicle type, e.g. "Draisine", "High-Speed Train",..
//     description?: string // Perhaps a description of the type of vehicle, that is falls into this category
// }
//
// export interface VehicleTypeCrUWebsite {
//     uid?: number, // Null, if creating vehicle type, some other value otherwise
//     name: string, // A descriptive name of the vehicle type, e.g. "Draisine", "High-Speed Train",..
//     description?: string // Perhaps a description of the type of vehicle, that is falls into this category
// }