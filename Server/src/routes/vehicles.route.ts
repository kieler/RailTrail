import {Request, Response, Router} from "express"
import {
    GetUidApp,
    ReturnUidApp,
    UpdateRequestApp,
    UpdateResponseApp,
    VehicleApp,
} from "../models/api.app"
import {Position, UpdateVehicle, Vehicle as APIVehicle} from "../models/api"
import {logger} from "../utils/logger"
import {authenticateJWT, jsonParser, v} from "."
import {
	GetUidSchema, UpdateRequestSchemaApp,
} from "../models/jsonschemas.app"
import TrackService from "../services/track.service"
import { Track, Tracker, Vehicle, VehicleType } from "@prisma/client"
import VehicleService from "../services/vehicle.service"
import { Feature, GeoJsonProperties, Point } from "geojson"
import { VehicleCrUSchemaWebsite } from "../models/jsonschemas.website"
import TrackerService from "../services/tracker.service"
import please_dont_crash from "../utils/please_dont_crash";
import {extractTrackID} from "./track.route";

/**
 * The router class for the routing of the vehicle data to app and website.
 */
export class VehicleRoute {
    /** The path of this api route. */
    public static path: string = "/"
    /** The sub router instance. */
    private static instance: VehicleRoute
    /** The base router object. */
    private router = Router()

    /**
     * The constructor to connect all of the routes with specific functions.
     */
    private constructor() {
        this.router.get('/vehicles/app/getId/:trackId', jsonParser, please_dont_crash(this.getUid));
        this.router.put("/vehicles/app", jsonParser, please_dont_crash(this.updateVehicleApp));

        // TODO: build intermediate route handler that parses (and validates) the vehicleID
        this.router.get("/track/:trackId/vehicles", authenticateJWT, extractTrackID, please_dont_crash(this.getVehiclesOnTrack));
        this.router.get("/vehicles", authenticateJWT, please_dont_crash(this.getAllVehicles));
        this.router.post("/track/:trackId/vehicles", authenticateJWT, extractTrackID, jsonParser, please_dont_crash(this.createVehicle));
        this.router.put("/track/:trackId/vehicles/:vehicleId", authenticateJWT, extractTrackID, jsonParser, please_dont_crash(this.updateVehicle));
        this.router.delete("/vehicles/:vehicleId", authenticateJWT, please_dont_crash(this.deleteVehicle));
    }

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!VehicleRoute.instance) {
			VehicleRoute.instance = new VehicleRoute()
		}
		return VehicleRoute.instance.router
	}

    /**
     * Updates location of app and gets some present information for the app. (vehicles near user etc.)
     * @param req An UpdateRequestWithLocationEnabled in the body.
     * @param res An UpdateResponseWithLocationEnabled with the useful information.
     * @returns Nothing.
     */
    private async updateVehicleApp(req: Request, res: Response): Promise<void> {
        const userData: UpdateRequestApp = req.body
        if (
            !userData || !v.validate(userData, UpdateRequestSchemaApp).valid
        ) {
            res.sendStatus(400)
            return
        }

		if (userData.pos) {
			const userVehicle: Vehicle | null = await VehicleService.getVehicleById(userData.vehicleId)
			if (!userVehicle) {
				logger.error(`Could not find vehicle with id ${userData.vehicleId}`)
				res.sendStatus(500)
				return
			}
			const pos: Feature<Point, GeoJsonProperties> | null = await VehicleService.getVehiclePosition(userVehicle)
			if (!pos) {
				logger.error(`Could not find position of vehicle with id ${userVehicle.uid}`)
				res.sendStatus(500)
				return
			}
			const position: Position = { lat: pos.geometry.coordinates[0], lng: pos.geometry.coordinates[1] }
			const heading: number = await VehicleService.getVehicleHeading(userVehicle)
			// TODO: Vehicle position of app user not implemented in db yet
			const ret: UpdateResponseApp = {
				pos: position,
				heading: heading,
				vehiclesNearUser: [
					{
						id: 1,
						name: 'foo',
						type: 0,
						trackerIds: [],
						pos: { lat: 54.189157, lng: 10.592452 },
						percentagePosition: 50,
						headingTowardsUser: false,
					},
					{
						id: 2,
						name: 'bar',
						type: 1,
						trackerIds: [],
						pos: { lat: 54.195082, lng: 10.591109 },
						percentagePosition: 51,
						headingTowardsUser: false,
					},
				],
				speed: 20,
				percentagePositionOnTrack: 100,
				passingPosition: { lat: 54.195082, lng: 10.591109 },
			}
			res.json(ret)
			return
		} else {
			const userVehicle: Vehicle | null = await VehicleService.getVehicleById(userData.vehicleId)
			if (!userVehicle) {
				logger.error(`Could not find vehicle with id ${userData.vehicleId}`)
				res.sendStatus(500)
				return
			}
			const pos: Feature<Point, GeoJsonProperties> | null = await VehicleService.getVehiclePosition(userVehicle)
			if (!pos) {
				logger.error(`Could not find position of vehicle with id ${userVehicle.uid}`)
				res.sendStatus(500)
				return
			}
			const position: Position = { lat: pos.geometry.coordinates[0], lng: pos.geometry.coordinates[1] }
			const heading: number = await VehicleService.getVehicleHeading(userVehicle)
			const nearbys: Vehicle[] | null = await VehicleService.getNearbyVehicles(userVehicle)
			const list: VehicleApp[] = []
			if (nearbys) {
				for (const nearby of nearbys) {
					const po: Feature<Point, GeoJsonProperties> | null = await VehicleService.getVehiclePosition(nearby)
					const percentage: number | null = await VehicleService.getVehicleTrackDistancePercentage(nearby)
					const ve: VehicleApp = {
						id: nearby.uid,
						pos: {
							lat: po?.geometry.coordinates[0] ? po?.geometry.coordinates[0] : 0,
							lng: po?.geometry.coordinates[1] ? po?.geometry.coordinates[1] : 0
						},
						percentagePosition: percentage ? percentage : 0,
						headingTowardsUser: false, // FIXME: Needs to be changed
						heading: 0, // FIXME: implement
						name: "", // FIXME: implement
						type: 0, // FIXME: implement
						trackerIds: [] // FIXME: implement
					}
					list.push(ve)
				}
			}
			const percentagePositionOnTrack: number | null = await VehicleService.getVehicleTrackDistancePercentage(userVehicle)
			if (!percentagePositionOnTrack) {
				logger.error(`Could not determine percentage position on track for vehicle with id ${userVehicle.uid}`)
				res.sendStatus(500)
				return
			}
			const ret: UpdateResponseApp = {
				pos: position,
				heading: heading,
				vehiclesNearUser: list,
				speed: await VehicleService.getVehicleSpeed(userVehicle),
				percentagePositionOnTrack: percentagePositionOnTrack
			}
			res.json(ret)
			return
		}
	}

    /**
     * Gets a list of the vehicles for the website containing their current information.
     * @param req A request containing no special information.
     * @param res A response containing a `VehicleWebsite[]`
     * @returns Nothing.
     */
    private async getVehiclesOnTrack(req: Request, res: Response): Promise<void> {
		// obtain track by previous track finding handler
        const track: Track | null = res.locals.track
        if (!track) {
            logger.error(`Could not find track which should be provided by extractTrackId`)
            res.sendStatus(500)
            return
        }
        const vehicles: Vehicle[] = await VehicleService.getAllVehiclesForTrack(track)
        const ret: APIVehicle[] = []
        for (const vehicle of vehicles) {
            const pos: Feature<Point, GeoJsonProperties> | null = await VehicleService.getVehiclePosition(vehicle)
            if (!pos) {
                logger.error(`Could not find position of vehicle with id ${vehicle.uid}`)
                res.sendStatus(500)
                return
            }
            const actualPos: Position = {lat: pos.geometry.coordinates[0], lng: pos.geometry.coordinates[1]}
            const heading: number | null = await VehicleService.getVehicleHeading(vehicle)
            if (!heading) {
                logger.error(`Could not find heading of vehicle with id ${vehicle.uid}`)
                res.sendStatus(500)
                return
            }
            const veh: APIVehicle = {
                id: vehicle.uid,
                name: vehicle.name ? vehicle.name : "Vehicle" + vehicle.uid,
                type: vehicle.typeId,
                pos: actualPos,
                heading: heading,
                trackerIds: [] // TODO: implement
            }
            ret.push(veh)
        }
        res.json(ret)
        return
    }

	/**
	 * Map the vehicle name to the uid of the backend.
	 * 
	 * @param req A request containing a `GetUidApp` with a vehicle name in the request body and a track id in the parameters
	 * to determine the vehicle.
	 * @param res The vehicles uid in a `ReturnUidApp`.
	 * @returns Nothing
	 */
	private async getUid(req: Request, res: Response): Promise<void> {
		const userData: GetUidApp = req.body
		const trackId: number = parseInt(req.params.trackId)
		if (
			!userData || !v.validate(userData, GetUidSchema).valid
		) {
			res.sendStatus(400)
			return
		}
		const track: Track | null = await TrackService.getTrackById(trackId)
		const vehicleId: number | null = 1 //TODO: Wait for impl: await VehicleService.getVehicleIdByName(userData.vehicleName)
		if (!vehicleId) {
			res.sendStatus(500)
			return
		}

		const ret: ReturnUidApp = { vehicleId: vehicleId }
		res.json({ ret })
		return
	}

    /**
     * Get a list of vehicles with all the required properties for CRUD operations
     * @param req A request containing a track id in the parameters
     * @param res A list of `VehicleListItemWebsite`.
     * @returns Nothing
     */
    private async getAllVehicles(req: Request, res: Response): Promise<void> {

		const ret: APIVehicle[] = await Promise.all(
			(await VehicleService.getAllVehicles())
				.map(async (x) => {
					const r: APIVehicle = {
						id: x.uid,
						name: x.name ? x.name : "Empty Name",
						type: x.typeId,
						trackerIds: (await TrackerService.getTrackerByVehicle(x.uid)).map((y) => y.uid)
					}
					return r
				}
				))

		if (!ret) {
			res.sendStatus(500)
			return
		}

		res.json(ret)
		return
	}

    /**
     * Updates or creates a vehicle of the database.
     * @param req A request containing a `VehicleCrUWebsite`.
     * @param res
     * @returns Nothing
     */
    private async updateVehicle(req: Request, res: Response): Promise<void> {
		const track: Track | null = res.locals.track
		if (!track) {
			logger.error(`Could not find track which should be provided by extractTrackId`)
			res.sendStatus(500)
			return
		}

        const vehicleId: number = parseInt(req.params.vehicleId);

        // check if both are numbers, and not NaN or infinity
        if (!isFinite(vehicleId)) {
            if (logger.isSillyEnabled())
                logger.silly(`Update for ${req.params.vehicleId} on ${req.params.trackId} failed. Not a number`)
            res.sendStatus(404)
            return
        }

        const userData: UpdateVehicle = req.body
        if (!userData
            || !v.validate(userData, VehicleCrUSchemaWebsite).valid) {
            res.sendStatus(400)
            return
        }

		// TODO: Add track to vehicle

        let vehicleToUpdate: Vehicle | null = await VehicleService.getVehicleById(vehicleId)
        if (!vehicleToUpdate) {
            logger.error(`Could not find vehicle to update with id ${userData.id}`)
            res.sendStatus(404)
            return
        }
        const type: VehicleType | null = await VehicleService.getVehicleTypeById(userData.type)
        if (!type) {
            logger.error(`Could not find vehicle type with id ${userData.type}`)
            res.sendStatus(400)
            return
        }
        // TODO: Can we start a transaction for this, so we won't have partially updated vehicles if something fails?
        // TODO: extract business logic to service

        vehicleToUpdate = await VehicleService.renameVehicle(vehicleToUpdate, userData.name)

        if (!vehicleToUpdate) {
            logger.error(`Could not rename vehicle with id ${userData.id}`)
            res.sendStatus(500)
            return
        }

        vehicleToUpdate = await VehicleService.setVehicleType(vehicleToUpdate, type)

        if (!vehicleToUpdate) {
            logger.error(`Could not set vehicle type for vehicle with typeid ${userData.type}`)
            res.sendStatus(500)
            return
        }

        if (userData.trackerIds && userData.trackerIds.length > 0) {
            for (const trackerId of userData.trackerIds) {
                const tracker: Tracker | null = await TrackerService.getTrackerById(trackerId)

                if (!tracker) {
                    logger.error(`Could not find tracker with id ${trackerId}`)
                    res.sendStatus(400)
                    return
                }
                const trackerToUpdate = await VehicleService.assignTrackerToVehicle(vehicleToUpdate, tracker)

                if (!trackerToUpdate) {
                    logger.error(`Could not set tracker with tracker-id ${trackerId}`)
                    res.sendStatus(500)
                    return
                }
            }
        }

        res.sendStatus(200)
        return
    }

    private async createVehicle(req: Request, res: Response) {
		const track: Track | null = res.locals.track
		if (!track) {
			logger.error(`Could not find track which should be provided by extractTrackId`)
			res.sendStatus(500)
			return
		}

        const userData: UpdateVehicle = req.body
        if (!userData
            || !v.validate(userData, VehicleCrUSchemaWebsite).valid) {
            res.sendStatus(400)
            return
        }

        const type: VehicleType | null = await VehicleService.getVehicleTypeById(userData.type)

        if (!type) {
            logger.error(`Could not find vehicle type with id ${userData.type}`)
            res.sendStatus(400)
            return
        }

        // TODO: Think about how trackers are created.
        const tracker: Tracker | null = userData.trackerIds && userData.trackerIds.length > 0 ?
            await TrackerService.getTrackerById(userData.trackerIds[0]) : null // TODO: The createVehicle will probably change

        const vehicle: Vehicle | null = await VehicleService.createVehicle(type, tracker ? tracker : undefined, userData.name)
        if (!vehicle) {
            logger.error(`Could not create vehicle`)
            res.sendStatus(500)
            return
        }

        res.status(200).json(vehicle.uid);
        return

    }

	/**
	 * Delete a vehicle with a specific uid from the database. 
	 * @param req A request containing a vehicle uid.
	 * @param res 
	 * @returns Nothing
	 */
	private async deleteVehicle(req: Request, res: Response): Promise<void> {
		const uid: number = parseInt(req.params.vehicleId)
		const vehicle: Vehicle | null = await VehicleService.getVehicleById(uid)
		if (!vehicle) {
			logger.error(`Could not find vehicle with id ${uid}`)
			res.sendStatus(404)
			return
		}

		const success: boolean = await VehicleService.removeVehicle(vehicle)
		if (!success) {
			logger.error(`Could not delete vehicle with id ${uid}`)
			res.sendStatus(500)
			return
		}
		res.sendStatus(200)
		return
	}
}
