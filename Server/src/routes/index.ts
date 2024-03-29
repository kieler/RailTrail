import { NextFunction, Request, Response, Router } from "express"
import { LoginRoute } from "./login.route"
import { VehicleRoute } from "./vehicle.route"
import { InitRoute } from "./init.route"
import { TrackerRoute } from "./tracker.route"
import * as jwt from "jsonwebtoken"
import { logger } from "../utils/logger"
import bodyParser from "body-parser"
import { randomBytes } from "crypto"
import { PoiRoute } from "./poi.route"
import { TrackRoute } from "./track.route"
import { UserRoute } from "./user.route"
import { VehicleTypeRoute } from "./vehicletype.route"
import { PoiTypeRoute } from "./poitype.route"
import { TokenPayload } from "../models/api"
import { z } from "zod"

// import { isTokenPayload } from "../models/api.website"

/** A basic jsonParser to parse the requestbodies. */
export const jsonParser = bodyParser.json()

/** A secret string that is used to create and verify the authentication tokens.*/
export const accessTokenSecret: string = randomBytes(128).toString("base64")

/**
 * The main routing class that connects all the subrouters.
 */
export class ApiRoutes {
	/** The base path for the api. This name was chosen to make sure it is obvious, that this is only a REST-API. */
	public static path = "/api"
	/** The main router instance. */
	public static instance: ApiRoutes

	/** The base router object. */
	private router = Router()

	/**
	 * Initializes the router with all of the subrouters.
	 */
	private constructor() {
		this.router.use(LoginRoute.path, LoginRoute.router)
		this.router.use(VehicleRoute.path, VehicleRoute.router)
		this.router.use(InitRoute.path, InitRoute.router)
		this.router.use(PoiRoute.path, PoiRoute.router)
		this.router.use(PoiTypeRoute.path, PoiTypeRoute.router)
		this.router.use(TrackRoute.path, TrackRoute.router)
		this.router.use(UserRoute.path, UserRoute.router)
		this.router.use(TrackerRoute.path, TrackerRoute.router)
		this.router.use(VehicleTypeRoute.path, VehicleTypeRoute.router)
	}

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!ApiRoutes.instance) {
			ApiRoutes.instance = new ApiRoutes()
		}
		return ApiRoutes.instance.router
	}
}

/**
 * This method handles the jsonwebtoken authentication. It uses a randomly generated secret and verifies
 * against the token from the user. In case of an error, the response will be 401.
 * @param req The current request that should contain an authorization header.
 * @param res The response that might be used to send a status.
 * @param next The next handler in the call chain
 * @returns Just `void`.
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization
	if (!authHeader) {
		res.sendStatus(401)
		return
	}
	// Bearer <token>
	if (!authHeader.startsWith("Bearer ")) {
		// invalid auth header
		res.sendStatus(401)
		return
	}
	const token = authHeader.replace(/^Bearer /, "")
	try {
		const user: jwt.JwtPayload | string = jwt.verify(token, accessTokenSecret as string)
		// verify that the token payload has the expected type
		const jwtPayload: z.infer<typeof TokenPayload> = TokenPayload.parse(user)
		// TODO: check expiration date?
		res.locals.username = jwtPayload.username
	} catch (err) {
		logger.error("Error occured during authentication.")
		res.sendStatus(401)
		return
	}
	next()
}
