import { FeatureCollection, GeoJSON, GeoJsonProperties, Point } from "geojson"
import { JwtPayload } from "jsonwebtoken"
import { z } from "zod"

/** @see {isPosition} ts-auto-guard:type-guard */
export type Position = {
	lat: number
	lng: number
}

export const Position = z.object({
	lat: z.number(),
	lng: z.number()
})

/** @see {isUpdateTrack} ts-auto-guard:type-guard */
//export type UpdateTrack = {
//	start: string //e.g. Malente
//	end: string // e.g. Lütjenburg
//	path: FeatureCollection<Point, GeoJsonProperties> // The track as geojson
//}

export const UpdateTrack = z.object({
	start: z.string(),
	end: z.string(),
	path: z.object({
		type: z.literal("FeatureCollection"),
		features: z
			.object({
				type: z.literal("Feature"),
				properties: z.object({}),
				geometry: z.object({
					type: z.literal("Point"),
					coordinates: z.number().array().length(2)
				})
			})
			.array()
	}) satisfies z.ZodType<FeatureCollection<Point, GeoJsonProperties>>
})

/**
 * Condensed Information about a Track.
 * Suitable, for example, to build a track selection interface
 */
/** @see {isBareTrack} ts-auto-guard:type-guard */
export type BareTrack = {
	id: number // Positive integer to uniquely identify track
	start: string //e.g. Malente
	end: string // e.g. Lütjenburg
}

/**
 * Complete information about a track. For display on a map or similar things.
 */
/** @see {isFullTrack} ts-auto-guard:type-guard */
export type FullTrack = BareTrack & {
	path: GeoJSON
	length: number // Total length of the track in meters
}

/** @see {isTrackList} ts-auto-guard:type-guard */
export type TrackList = BareTrack[]

/** @see {isCreatePOITypeIcon} ts-auto-guard:type-guard */
export enum POITypeIcon {
	Generic = 0,
	LevelCrossing = 1,
	LesserLevelCrossing = 2,
	Picnic = 3,
	TrackEnd = 4,
	TurningPoint = 5
}

/** @see {isCreatePOIType} ts-auto-guard:type-guard */
export type CreatePOIType = {
	name: string
	icon: POITypeIcon
	description?: string
}

/** @see {isPOIType} ts-auto-guard:type-guard */
export type POIType = CreatePOIType & {
	id: number
}

/**
 * The payload used to update/create a poi using the CRUD api
 */
/** @see {isUpdatePointOfInterest} ts-auto-guard:type-guard */
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
/** @see {isPointOfInterest} ts-auto-guard:type-guard */
export type PointOfInterest = UpdatePointOfInterest & {
	id: number
	percentagePosition: number // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
}

/**
 * The payload used to create/update a vehicle using the CRUD api.
 */
/** @see {isUpdateVehicle} ts-auto-guard:type-guard */
export type UpdateVehicle = {
	name: string
	track: number
	type: number
	trackerIds: string[]
}

/**
 * The vehicle with a position that might be known.
 */
/** @see {isVehicle} ts-auto-guard:type-guard */
export type Vehicle = UpdateVehicle & {
	id: number
	pos?: Position // undefined if position is unknown.
	percentagePosition?: number // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
	heading?: number // between 0 and 360
}

/**
 * The Payload type used to update/create a vehicle type with the CRUD api
 */
/** @see {isUpdateVehicleType} ts-auto-guard:type-guard */
export type UpdateVehicleType = {
	name: string // A descriptive name of the vehicle type, e.g. "Draisine", "High-Speed Train",..
	description?: string // Perhaps a description of the type of vehicle, that is falls into this category
	icon: string
}

/**
 * A representation of a vehicle type
 */
/** @see {isVehicleType} ts-auto-guard:type-guard */
export type VehicleType = UpdateVehicleType & {
	id: number
}

/**
 * Representation of the tracker
 */
/** @see {isTracker} ts-auto-guard:type-guard */
export type Tracker = {
	id: string
	vehicleId: number | null
	data?: unknown
}

/**
 * The format of the payload data in an authentication JWT.
 */
/** @see {isTokenPayload} ts-auto-guard:type-guard */
export type TokenPayload = JwtPayload & {
	username: string
	// By jwt standard: issued at
	iat?: number
}
