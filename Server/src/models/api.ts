import { FeatureCollection, GeoJsonProperties, Point, Feature, LineString } from "geojson"
import { JwtPayload } from "jsonwebtoken"
import { z } from "zod"

export const Position = z.object({
	lat: z.number(),
	lng: z.number()
})

export const UpdateTrack = z.object({
	start: z.string().nonempty(),
	end: z.string().nonempty(),
	path: z.object({
		type: z.literal("FeatureCollection"),
		features: z
			.object({
				type: z.literal("Feature"),
				properties: z.record(z.any()).nullable(),
				geometry: z.object({
					type: z.literal("Point"),
					coordinates: z.number().array().length(2)
				}),
				id: z.union([z.string(), z.number()]).optional()
			})
			.array()
	}) satisfies z.ZodType<FeatureCollection<Point, GeoJsonProperties>>
})

/**
 * Condensed Information about a Track.
 * Suitable, for example, to build a track selection interface
 */
export const BareTrack = z.object({
	id: z.number().int().nonnegative(), // Positive integer to uniquely identify track
	start: z.string().nonempty(), //e.g. Malente
	end: z.string().nonempty() // e.g. Lütjenburg
})

/**
 * Complete information about a track. For display on a map or similar things.
 */
export const FullTrack = BareTrack.extend({
	length: z.number(), // Total length of the track in meters
	path: z.object({
		type: z.literal("Feature"),
		properties: z.record(z.any()).nullable(),
		geometry: z.object({
			type: z.literal("LineString"),
			coordinates: z.number().array().array()
		}),
		id: z.union([z.string(), z.number()]).optional()
	}) satisfies z.ZodType<Feature<LineString>>
})

export const TrackList = BareTrack.array()

export enum POITypeIconEnum {
	Generic = 0,
	LevelCrossing = 1,
	LesserLevelCrossing = 2,
	Picnic = 3,
	TrackEnd = 4,
	TurningPoint = 5
}

export const POITypeIcon = z.nativeEnum(POITypeIconEnum)

export const CreatePOIType = z.object({
	name: z.string().nonempty(),
	icon: POITypeIcon,
	description: z.string().optional()
})

export const POIType = CreatePOIType.extend({
	id: z.number().int().nonnegative()
})

/**
 * The payload used to update/create a poi using the CRUD api
 */
export const UpdatePointOfInterest = z.object({
	id: z.number().int().nonnegative().optional(), // TODO: why?
	typeId: z.number().int().nonnegative(),
	name: z.string().nonempty(),
	description: z.string().optional(),
	pos: Position, // A gps position of the poi
	isTurningPoint: z.boolean(), // Can a vehicle be turned at this poi?
	trackId: z.number().int().nonnegative()
})

/**
 * A POI as returned by the backend, enriched with a percentage position.
 */
export const PointOfInterest = UpdatePointOfInterest.extend({
	id: z.number().int().nonnegative(),
	percentagePosition: z.number() // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
})

/**
 * The payload used to create/update a vehicle using the CRUD api.
 */
export const UpdateVehicle = z.object({
	name: z.string().nonempty(),
	track: z.number().int().nonnegative(),
	type: z.number().int().nonnegative(),
	trackerIds: z.array(z.string().nonempty())
})

/**
 * The vehicle with a position that might be known.
 */
export const Vehicle = UpdateVehicle.extend({
	id: z.number().int().nonnegative(),
	pos: Position.optional(), // undefined if position is unknown.
	percentagePosition: z.number().optional(), // A position mapped onto percentage 0-100) e.g. 0% Malente; 100% Lütjenburg
	heading: z.number().optional(), // between 0 and 360
	speed: z.number().optional() // in km/h
})

/**
 * The Payload type used to update/create a vehicle type with the CRUD api
 */
export const UpdateVehicleType = z.object({
	name: z.string().nonempty(), // A descriptive name of the vehicle type, e.g. "Draisine", "High-Speed Train",..
	description: z.string().optional(), // Perhaps a description of the type of vehicle, that is falls into this category
	icon: z.string()
})

/**
 * A representation of a vehicle type
 */
export const VehicleType = UpdateVehicleType.extend({
	id: z.number().int().nonnegative()
})

/**
 * Representation of the tracker
 */
export const Tracker = z.object({
	id: z.string().nonempty(),
	vehicleId: z.number().int().nonnegative().nullable(),
	battery: z.number().optional(), // ideally between 0 (empty) and 1 (full). But probably some arbitrary value...
	data: z.unknown().optional()
})

/**
 * The format of the payload data in an authentication JWT.
 */
export const TokenPayload = z.record(z.any()).and(
	z.object({
		iss: z.union([z.string(), z.undefined()]).optional(),
		sub: z.union([z.string(), z.undefined()]).optional(),
		aud: z.union([z.string(), z.array(z.string()), z.undefined()]).optional(),
		exp: z.union([z.number(), z.undefined()]).optional(),
		nbf: z.union([z.number(), z.undefined()]).optional(),
		iat: z.union([z.number(), z.undefined()]).optional(),
		jti: z.union([z.string(), z.undefined()]).optional(),
		username: z.string()
	})
) satisfies z.ZodType<JwtPayload>
