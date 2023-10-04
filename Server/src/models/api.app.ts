import { PointOfInterest, Position, Vehicle } from "./api"
import { z } from "zod"

// TODO: seperate the types
export const InitResponseApp = z.object({
	trackId: z.number().int().nonnegative(),
	trackName: z.string().nonempty(),
	trackPath: z.any(), //TODO: What kind of FeatureCollection? old ->GeoJSON.FeatureCollection
	trackLength: z.number(),
	pointsOfInterest: PointOfInterest.array()
}) // FullTrack & {pointsOfInterest: PointOfInterest[];};

// TODO: change to just BareTrack.
export const TrackListEntryApp = z.object({
	id: z.number().int().nonnegative(), // Positive integer to uniquely identify track
	name: z.string().nonempty() // E.g. "Malente-Lütjenburg"
})

// TODO: simplify to just Position, without wrapping.
export const InitRequestApp = z.object({
	pos: Position
})

export const UpdateRequestApp = z.object({
	vehicleId: z.number().int().nonnegative(), // vehicle id of user
	pos: Position.optional(), // the current position of user
	speed: z.number().optional(), // Speed in km/h
	heading: z.number().optional(), // Heading of the vehicle between 0 and 359
	timestamp: z.number().optional()  // Timestamp of GPS measurement in milliseconds since epoch
})

//================ new

/**
 * A Vehicle with a position enriched with a percentage position
 * if it is heading towards a user.
 * TODO: replace with a specific API
 */
export const VehicleApp = Vehicle.extend({
	id: z.number().int().nonnegative(),
	headingTowardsUser: z.boolean().optional() // Is the other vehicle heading towards the user?
})

//================ new

export const UpdateResponseApp = z.object({
	pos: Position, // The current position as measured by vehicle
	heading: z.number(), // Heading of the vehicle between 0 and 359
	vehiclesNearUser: VehicleApp.array(), // Vehicles that should be marked on the map
	percentagePositionOnTrack: z.number(), // Percentage (0-100) e.g. 0% Malente; 100% Lütjenburg
	speed: z.number(), // Speed in km/h
	passingPosition: Position.optional() // Only set if needed
})

export const GetUidApp = z.object({
	vehicleName: z.string().nonempty(),
	trackId: z.number().int().nonnegative()
})

export const ReturnUidApp = z.object({
	vehicleId: z.number().int().nonnegative()
})
