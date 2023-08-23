import { PointOfInterest, Position, Vehicle } from "./api"
import { GeoJSON } from "geojson"

// TODO: seperate the types
/** @see {isInitResponseApp} ts-auto-guard:type-guard */
export type InitResponseApp = {
	trackId: number
	trackName: string
	trackPath?: GeoJSON
	trackLength: number
	pointsOfInterest: PointOfInterest[]
} // FullTrack & {pointsOfInterest: PointOfInterest[];};

// TODO: change to just BareTrack.
/** @see {isTrackListEntryApp} ts-auto-guard:type-guard */
export type TrackListEntryApp = {
	id: number // Positive integer to uniquely identify track
	name: string // E.g. "Malente-Lütjenburg"
}

// TODO: simplify to just Position, without wrapping.
/** @see {isInitRequestApp} ts-auto-guard:type-guard */
export type InitRequestApp = {
	pos: Position
}

// export enum POIType {
//     None = 0,
//     LevelCrossing = 1,
//     LesserLevelCrossing = 2,
//     Picnic = 3,
//     TrackEnd = 4,
// }

/** @see {isUpdateRequestApp} ts-auto-guard:type-guard */
export interface UpdateRequestApp {
	vehicleId: number // vehicle id of user
	pos?: Position // the current position of user
	speed?: number // Speed in km/h
	heading?: number // Heading of the vehicle between 0 and 359
}

/** @see {isUpdateResponseApp} ts-auto-guard:type-guard */
export interface UpdateResponseApp {
	pos: Position // The current position as measured by vehicle
	heading: number // Heading of the vehicle between 0 and 359
	vehiclesNearUser: VehicleApp[] // Vehicles that should be marked on the map
	percentagePositionOnTrack: number // Percentage (0-100) e.g. 0% Malente; 100% Lütjenburg
	speed: number // Speed in km/h
	passingPosition?: Position // Only set if needed
}

/** @see {isGetUidApp} ts-auto-guard:type-guard */
export interface GetUidApp {
	vehicleName: string
	trackId: number
}

/** @see {isReturnUidApp} ts-auto-guard:type-guard */
export interface ReturnUidApp {
	vehicleId: number
}

//================ new

/**
 * A Vehicle with a position enriched with a percentage position
 * if it is heading towards a user.
 * TODO: replace with a specific API
 */
/** @see {isVehicleApp} ts-auto-guard:type-guard */
export interface VehicleApp extends Vehicle {
	id: number
	headingTowardsUser: boolean // Is the other vehicle heading towards the user?
}
