import { NextFunction, Request, Response, Router } from "express"
import { authenticateJWT, jsonParser } from "."
import TrackService from "../services/track.service"
import { POI, Track, Vehicle } from "@prisma/client"
import please_dont_crash from "../utils/please_dont_crash"
import { logger } from "../utils/logger"
import { BareTrack, FullTrack, PointOfInterest, Position, UpdateTrack, Vehicle as APIVehicle } from "../models/api"
import VehicleService from "../services/vehicle.service"
import { Feature, LineString, Point } from "geojson"
import POIService from "../services/poi.service"
import GeoJSONUtils from "../utils/geojsonUtils"
import database from "../services/database.service"

/**
 * The router class for the routing of the track uploads from the website.
 */
export class TrackRoute {
	/** The path of this api route. */
	public static path: string = "/track"
	/** The sub router instance. */
	private static instance: TrackRoute
	/** The base router object. */
	private router = Router()

	/**
	 * The constructor to connect all of the routes with specific functions.
	 */
	private constructor() {
		this.router.post("/", authenticateJWT, jsonParser, please_dont_crash(this.addTrack))
		this.router.get("/", authenticateJWT, please_dont_crash(this.getAllTracks))
		this.router.get("/:trackId", authenticateJWT, extractTrackID, this.getTrackByID) // getTrackByID is not async (because it does not need to be), so please_dont_crash is not needed.

		this.router.put("/:trackId", authenticateJWT, extractTrackID, jsonParser, please_dont_crash(this.updateTrack))
		this.router.delete("/:trackId", authenticateJWT, extractTrackID, please_dont_crash(this.deleteTrack))

		this.router.get("/:trackId/vehicles", authenticateJWT, extractTrackID, please_dont_crash(this.getVehiclesOnTrack))
		this.router.get("/:trackId/pois", authenticateJWT, extractTrackID, please_dont_crash(this.getPOIsOnTrack))
	}

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!TrackRoute.instance) {
			TrackRoute.instance = new TrackRoute()
		}
		return TrackRoute.instance.router
	}

	/**
	 * Upload a geojson file to the backend.
	 * @param req A request containing a geojson with the path.
	 * @param res Just a status code.
	 * @returns Nothing.
	 */
	private async addTrack(req: Request, res: Response): Promise<void> {
		const userDataPayload = UpdateTrack.safeParse(req.body)
		if (!userDataPayload.success) {
			logger.http(userDataPayload.error)
			res.sendStatus(400)
			return
		}
		const userData = userDataPayload.data

		const start: string = userData.start
		const end: string = userData.end
		const ret: Track | null = await TrackService.createTrack(userData.path, start, end)
		if (!ret) {
			// TODO: think about different error conditions and appropriate responses.
			res.sendStatus(500)
			return
		}
		res.sendStatus(201)
		return
	}

	/**
	 * This function is used to get a list of all tracknames in the system together with their internal id.
	 * @param _req The api request.
	 * @param res Will contain a list of TrackListEntries if successful.
	 * @returns Nothing
	 */
	private async getAllTracks(_req: Request, res: Response): Promise<void> {
		const ret: BareTrack[] = (await database.tracks.getAll()).map(({ start, stop, uid }: Track) => ({
			id: uid,
			start: start,
			end: stop
		}))
		res.json(ret)
		return
	}

	private getTrackByID(_req: Request, res: Response) {
		// get the track extracted by "extractTrackID".
		const track: Track | undefined = res.locals.track

		// sanity check that we got something from the previous route handler
		if (!track) {
			logger.error(`Could not find track which should be provided by extractTrackId`)
			res.sendStatus(500)
			return
		}

		// derive and transform the database data for easier digestion by the clients.
		const path: Feature<LineString> | null = TrackService.getTrackAsLineString(track)
		const length: number | null = TrackService.getTrackLength(track)

		if (!path) {
			logger.error(`Could not get track with id ${track.uid} as a line string`)
			res.sendStatus(500)
			return
		}

		if (length == null) {
			logger.error(`Length of track with id ${track.uid} could not be determined`)
			res.sendStatus(500)
			return
		}

		// Build the response object
		const api_track: FullTrack = {
			id: track.uid,
			start: track.start,
			end: track.stop,
			path,
			length
		}

		// and respond to the client.
		res.json(api_track)
		return
	}

	/**
	 * Update an already existing track with, for example, a new path.
	 * @param req A request containing a geojson with the path.
	 * @param res Just a status code.
	 * @returns Nothing.
	 */
	private async updateTrack(req: Request, res: Response): Promise<void> {
		const userDataPayload = UpdateTrack.safeParse(req.body)
		if (!userDataPayload.success) {
			logger.http(userDataPayload.error)
			res.sendStatus(400)
			return
		}
		const userData = userDataPayload.data

		// get the track extracted by "extractTrackID".
		const track: Track | undefined = res.locals.track

		// sanity check that we got something from the previous route handler
		if (!track) {
			logger.error(`Could not find track which should be provided by extractTrackId`)
			res.sendStatus(500)
			return
		}

		if (
			!userData //|| !v.validate(userData, TrackPathSchemaWebsite
		) {
			res.sendStatus(400)
			return
		}
		const start: string = userData.start
		const end: string = userData.end
		const ret: Track | null = await TrackService.updateTrack(track, userData.path, start, end)
		if (!ret) {
			// TODO: think about different error conditions and appropriate responses.
			res.sendStatus(500)
			return
		}
		res.sendStatus(200)
		return
	}

	/**
	 * Delete a track.
	 * @param _req A request containing a geojson with the path.
	 * @param res Just a status code.
	 * @returns Nothing.
	 */
	private async deleteTrack(_req: Request, res: Response): Promise<void> {
		// get the track extracted by "extractTrackID".
		const track: Track | undefined = res.locals.track

		// sanity check that we got something from the previous route handler
		if (!track) {
			logger.error(`Could not find track which should be provided by extractTrackId`)
			res.sendStatus(500)
			return
		}

		const ret = await database.tracks.remove(track.uid)

		if (!ret) {
			// TODO: think about different error conditions and appropriate responses.
			res.sendStatus(500)
			return
		}
		res.sendStatus(200)
		return
	}

	/**
	 * Gets a list of the vehicles for the website containing their current information.
	 *
	 * // TODO: remove probable code duplication with vehicle route
	 * @param _req A request containing no special information.
	 * @param res A response containing a `VehicleWebsite[]`
	 * @returns Nothing.
	 */
	private async getVehiclesOnTrack(_req: Request, res: Response): Promise<void> {
		// obtain track by previous track finding handler
		const track: Track | null = res.locals.track
		if (!track) {
			logger.error(`Could not find track which should be provided by extractTrackId`)
			res.sendStatus(500)
			return
		}
		// obtain vehicles associated with the track from the db.
		const vehicles: Vehicle[] = await database.vehicles.getAll(track.uid)
		const ret: APIVehicle[] = await Promise.all(
			vehicles.map(async (vehicle: Vehicle) => {
				// get the current position of the vehicle
				const geo_pos = await VehicleService.getVehiclePosition(vehicle)
				const trackKm = geo_pos ? GeoJSONUtils.getTrackKm(geo_pos) : undefined
				// If we know that, convert it in the API format.
				const pos: Position | undefined = geo_pos
					? {
							lat: GeoJSONUtils.getLatitude(geo_pos),
							lng: GeoJSONUtils.getLongitude(geo_pos)
					  }
					: undefined
				// Also acquire the percentage position. It might happen that a percentage position is known, while the position is not.
				// This might not make much sense.
				const percentagePosition: number | undefined = trackKm != null
					? (await TrackService.getTrackKmAsPercentage(trackKm, track)) ?? undefined
					: undefined
				const heading: number = await VehicleService.getVehicleHeading(vehicle)
				const speed: number = await VehicleService.getVehicleSpeed(vehicle)
				return {
					id: vehicle.uid,
					track: vehicle.trackId,
					name: vehicle.name ? vehicle.name : "Empty Name",
					type: vehicle.typeId,
					trackerIds: (await database.trackers.getByVehicleId(vehicle.uid)).map(y => y.uid),
					pos,
					percentagePosition,
					heading,
					speed
				}
			})
		)

		res.json(ret)
		return
	}

	/**
	 * Gets a list of the POIs for the website containing their current information.
	 * @param _req A request containing no special information.
	 * @param res A response containing a `VehicleWebsite[]`
	 * @returns Nothing.
	 */
	private async getPOIsOnTrack(_req: Request, res: Response): Promise<void> {
		// obtain track by previous track finding handler
		const track: Track | null = res.locals.track
		if (!track) {
			logger.error(`Could not find track which should be provided by extractTrackId`)
			res.sendStatus(500)
			return
		}
		const pois: POI[] = await database.pois.getAll(track.uid)
		const ret: PointOfInterest[] = (
			await Promise.all(
				pois.map(async (poi: POI) => {
					const pos: Feature<Point> | null = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position)
					if (!pos) {
						logger.error(`Could not find position of POI with id ${poi.uid}`)
						// res.sendStatus(500)
						return []
					}
					const actualPos: Position = { lat: GeoJSONUtils.getLatitude(pos), lng: GeoJSONUtils.getLongitude(pos) }
					const percentagePosition: number | null = await POIService.getPOITrackDistancePercentage(poi)

					if (percentagePosition == null) {
						logger.error(`Could not find percentage position of POI with id ${poi.uid}`)
						// res.sendStatus(500)
						return []
					}

					const api_poi: PointOfInterest = {
						id: poi.uid,
						name: poi.name,
						typeId: poi.typeId,
						pos: actualPos,
						trackId: poi.trackId,
						description: poi.description ?? undefined,
						isTurningPoint: poi.isTurningPoint,
						percentagePosition: percentagePosition
					}
					return api_poi
				})
			)
		).flat()
		res.json(ret)
		return
	}
}

/**
 * A utility "middleware-ish" function that, given a route segment `:trackID`, finds the respective track and
 * places it in the res.locals object, if such a track exists.
 *
 * Will directly respond with a 404 error otherwise.
 */
export const extractTrackID = please_dont_crash(async (req: Request, res: Response, next: NextFunction) => {
	const trackId: number = parseInt(req.params.trackId)

	// check if both are numbers, and not NaN or Infinity
	if (!isFinite(trackId)) {
		if (logger.isSillyEnabled()) logger.silly(`Request for ${req.params.trackId} failed. Not a number`)
		res.sendStatus(404)
		return
	}

	// obtain the track from the database
	const track: Track | null = await database.tracks.getById(trackId)

	if (track) {
		// If the track exists, continue with route handling
		if (logger.isSillyEnabled()) logger.silly(`Found track ${track.uid}`)
		res.locals.track = track
		next()
		return
	} else {
		// otherwise log and return 404
		if (logger.isSillyEnabled()) logger.silly(`Request for ${req.params.trackId} failed. Not found in Database`)
		res.sendStatus(404)
		return
	}
})
