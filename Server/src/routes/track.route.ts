import { Request, Response, Router } from "express"
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
import { z } from "zod"

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
		this.router.get("/:trackId", authenticateJWT, please_dont_crash(this.getTrackByID)) // getTrackByID is not async (because it does not need to be), so please_dont_crash is not needed.

		this.router.put("/:trackId", authenticateJWT, jsonParser, please_dont_crash(this.updateTrack))
		this.router.delete("/:trackId", authenticateJWT, please_dont_crash(this.deleteTrack))

		this.router.get("/:trackId/vehicles", authenticateJWT, please_dont_crash(this.getVehiclesOnTrack))
		this.router.get("/:trackId/pois", authenticateJWT, please_dont_crash(this.getPOIsOnTrack))
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
		const trackPayload = UpdateTrack.parse(req.body)

		const start: string = trackPayload.start

		const end: string = trackPayload.end

		const ret: Track | null = await TrackService.createTrack(trackPayload.path, start, end)
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
		const ret: z.infer<typeof BareTrack>[] = (await database.tracks.getAll()).map(({ start, stop, uid }: Track) => ({
			id: uid,
			start: start,
			end: stop
		}))
		res.json(ret)
		return
	}

	private async getTrackByID(req: Request, res: Response) {
		const trackId: number = parseInt(req.params.trackId)

		// check if both are numbers, and not NaN or Infinity
		if (!isFinite(trackId)) {
			if (logger.isSillyEnabled()) logger.silly(`Request for ${req.params.trackId} failed. Not a number`)
			res.sendStatus(404)
			return
		}

		// obtain the track from the database
		const track: Track = await database.tracks.getById(trackId)

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
		const api_track: z.infer<typeof FullTrack> = {
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
		const trackPayload = UpdateTrack.parse(req.body)

		const trackId: number = parseInt(req.params.trackId)

		// check if both are numbers, and not NaN or Infinity
		if (!isFinite(trackId)) {
			if (logger.isSillyEnabled()) logger.silly(`Request for ${req.params.trackId} failed. Not a number`)
			res.sendStatus(404)
			return
		}
		const { start, end, path } = trackPayload

		await TrackService.updateTrack(trackId, path, start, end)

		res.sendStatus(200)
		return
	}

	/**
	 * Delete a track.
	 * @param req A request containing the trackID
	 * @param res Just a status code.
	 * @returns Nothing.
	 */
	private async deleteTrack(req: Request, res: Response): Promise<void> {
		const trackId: number = parseInt(req.params.trackId)

		// check if both are numbers, and not NaN or Infinity
		if (!isFinite(trackId)) {
			if (logger.isSillyEnabled()) logger.silly(`Request for ${req.params.trackId} failed. Not a number`)
			res.sendStatus(404)
			return
		}

		await database.tracks.remove(trackId)

		res.sendStatus(200)
		return
	}

	/**
	 * Gets a list of the vehicles for the website containing their current information.
	 *
	 * @param req A request containing no special information.
	 * @param res A response containing a `VehicleWebsite[]`
	 * @returns Nothing.
	 */
	private async getVehiclesOnTrack(req: Request, res: Response): Promise<void> {
		const trackId: number = parseInt(req.params.trackId)

		// check if both are numbers, and not NaN or Infinity
		if (!isFinite(trackId)) {
			if (logger.isSillyEnabled()) logger.silly(`Request for ${req.params.trackId} failed. Not a number`)
			res.sendStatus(404)
			return
		}

		// obtain the track from the database
		// TODO: remove after service adjustments, or replace with join after controller adjustments
		const track: Track = await database.tracks.getById(trackId)

		// obtain vehicles associated with the track from the db.
		const vehicles: Vehicle[] = await database.vehicles.getAll(track.uid)
		const ret: z.infer<typeof APIVehicle>[] = await Promise.all(
			vehicles
				.map(async (vehicle: Vehicle) => {
					// TODO: remove error catching after service changes
					// get the current position of the vehicle
					const heading: number | undefined = await VehicleService.getVehicleHeading(vehicle).catch(() => undefined)
					const speed: number | undefined = await VehicleService.getVehicleSpeed(vehicle).catch(() => undefined)
					const geo_pos = await VehicleService.getVehiclePosition(vehicle, heading ?? -1, speed ?? 0)
					const trackKm = geo_pos ? GeoJSONUtils.getTrackKm(geo_pos) : undefined
					// If we know that, convert it in the API format.
					const pos: z.infer<typeof Position> | undefined = geo_pos
						? {
								lat: GeoJSONUtils.getLatitude(geo_pos),
								lng: GeoJSONUtils.getLongitude(geo_pos)
						}
						: undefined
					// Also acquire the percentage position. It might happen that a percentage position is known, while the position is not.
					// This might not make much sense.
					const percentagePosition: number | undefined =
						trackKm != null ? (await TrackService.getTrackKmAsPercentage(trackKm, track)) ?? undefined : undefined
					return {
						id: vehicle.uid,
						pos,
						percentagePosition,
						heading,
						name: vehicle.name ? vehicle.name : "Empty Name",
						track: vehicle.trackId,
						type: vehicle.typeId,
						trackerIds: (await database.trackers.getByVehicleId(vehicle.uid)).map(y => y.uid),
						speed
					}
				})
				.map(p => p.catch(() => []))
		).then(res => res.flat())

		res.json(ret)
		return
	}

	/**
	 * Gets a list of the POIs for the website containing their current information.
	 * @param req A request containing no special information.
	 * @param res A response containing a `VehicleWebsite[]`
	 * @returns Nothing.
	 */
	private async getPOIsOnTrack(req: Request, res: Response): Promise<void> {
		const trackId: number = parseInt(req.params.trackId)

		// check if both are numbers, and not NaN or Infinity
		if (!isFinite(trackId)) {
			if (logger.isSillyEnabled()) logger.silly(`Request for ${req.params.trackId} failed. Not a number`)
			res.sendStatus(404)
			return
		}

		const pois: POI[] = await database.pois.getAll(trackId)
		const ret: z.infer<typeof PointOfInterest>[] = (
			await Promise.all(
				pois.map(async (poi: POI) => {
					const pos: Feature<Point> | null = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position)
					if (!pos) {
						logger.error(`Could not find position of POI with id ${poi.uid}`)
						// res.sendStatus(500)
						return []
					}
					const actualPos: z.infer<typeof Position> = {
						lat: GeoJSONUtils.getLatitude(pos),
						lng: GeoJSONUtils.getLongitude(pos)
					}
					const percentagePosition: number | null = await POIService.getPOITrackDistancePercentage(poi)

					if (percentagePosition == null) {
						logger.error(`Could not find percentage position of POI with id ${poi.uid}`)
						// res.sendStatus(500)
						return []
					}

					const api_poi: z.infer<typeof PointOfInterest> = {
						id: poi.uid,
						name: poi.name,
						percentagePosition: percentagePosition,
						typeId: poi.typeId,
						description: poi.description ?? undefined,
						pos: actualPos,
						isTurningPoint: poi.isTurningPoint,
						trackId: poi.trackId
					}
					return api_poi
				})
			)
		).flat()
		res.json(ret)
		return
	}
}
