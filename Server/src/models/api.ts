import { Feature, FeatureCollection, GeoJsonProperties, LineString, Point } from "geojson"
import { JwtPayload } from "jsonwebtoken"

export type Position = {
	lat: number
	lng: number
}

export type UpdateTrack = {
	start: string //e.g. Malente
	end: string // e.g. Lütjenburg
	path: FeatureCollection<Point, GeoJsonProperties> // The track as geojson
}

/**
 * Condensed Information about a Track.
 * Suitable, for example, to build a track selection interface
 */
export type BareTrack = {
	id: number // Positive integer to uniquely identify track
	start: string //e.g. Malente
	end: string // e.g. Lütjenburg
}

/**
 * Complete information about a track. For display on a map or similar things.
 */
export type FullTrack = BareTrack & {
	path: Feature<LineString>
	length: number // Total length of the track in meters
}

export type TrackList = BareTrack[]

export type CreatePOIType = {
	name: string
	icon: string
	description?: string
}

export type POIType = CreatePOIType & {
	id: number
}

/**
 * The payload used to update/create a poi using the CRUD api
 */
export type UpdatePointOfInterest = {
	id?: number
	typeId: number
	name: string
	description?: string
	pos: Position // A gps position of the poi
	isTurningPoint: boolean // Can a vehicle be turned at this poi?
	trackId: number
}

/**
 * A POI as returned by the backend, enriched with a percentage position.
 */
export type PointOfInterest = UpdatePointOfInterest & {
	id: number
	percentagePosition: number // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
}

/**
 * The payload used to create/update a vehicle using the CRUD api.
 */
export type UpdateVehicle = {
	name: string
	track: number
	type: number
	trackerIds: string[]
}

/**
 * The vehicle with a position that might be known.
 */
export type Vehicle = UpdateVehicle & {
	id: number
	pos?: Position // undefined if position is unknown.
	percentagePosition?: number // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
	heading?: number // between 0 and 360
}

/**
 * The Payload type used to update/create a vehicle type with the CRUD api
 */
export type UpdateVehicleType = {
	name: string // A descriptive name of the vehicle type, e.g. "Draisine", "High-Speed Train",..
	description?: string // Perhaps a description of the type of vehicle, that is falls into this category
	icon: string
}

/**
 * A representation of a vehicle type
 */
export type VehicleType = UpdateVehicleType & {
	id: number
}

/**
 * Representation of the tracker
 */
export type Tracker = {
	id: string
	vehicleId?: number
	data?: any
}

/**
 * The format of the payload data in an authentication JWT.
 */
export type TokenPayload = JwtPayload & {
	username: string
	// By jwt standard: issued at
	iat?: number
}

/**
 * Check if a given object is a JWR token payload
 * @param payload
 */
export function isTokenPayload(payload: TokenPayload | any): payload is TokenPayload {
	return typeof payload.username === "string" && (payload.iat === undefined || typeof payload.iat === "number")
}
