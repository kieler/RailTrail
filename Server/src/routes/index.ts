import { Request, Response, Router } from "express";

import { LoginRoute } from "./login.route";
import { VehicleRoute } from "./vehicles.route";
import { InitRoute } from "./init.route";
import * as jwt from "jsonwebtoken";
import { logger } from "../utils/logger";
import bodyParser from "body-parser";
import { randomBytes } from "crypto";
import { PoiRoute } from "./poi.route";
import { TrackUploadRoute } from "./trackupload.route";
const Validator = require('jsonschema').Validator;

const config = require("../config/index");
/** A basic jsonParser to parse the requestbodies. */
export const jsonParser = bodyParser.json();

/** A validator for json schema validation. */
export const v = new Validator();

/** A secret string that is used to create and verify the authentication tokens.*/
export const accessTokenSecret: string = randomBytes(128).toString("base64");

/**
 * The main routing class that connects all the subrouters.
 */
export class ApiRoutes {
	/** The base path for the api. This name was chosen to make sure it is obvious, that this is only a REST-API. */
	public static path = "/api";
	/** The main router instance. */
	public static instance: ApiRoutes;

	/** The base router object. */
	private router = Router();

	/**
	 * Initializes the router with all of the subrouters.
	 */
	private constructor() {
		this.router.use(LoginRoute.path, LoginRoute.router);
		this.router.use(VehicleRoute.path, VehicleRoute.router);
		this.router.use(InitRoute.path, InitRoute.router);
		this.router.use(PoiRoute.path, PoiRoute.router);
		this.router.use(TrackUploadRoute.path, TrackUploadRoute.router);
	}

	/**
	 * Creates an instance if there is none yet.
	 */
	static get router() {
		if (!ApiRoutes.instance) {
			ApiRoutes.instance = new ApiRoutes();
		}
		return ApiRoutes.instance.router;
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
export const authenticateJWT = (req: Request, res: Response, next: any) => {
	const authHeader = req.headers.authorization;

	if (authHeader) {
		// Bearer <token>
		const token = authHeader.split(" ")[1];
		try {
			let user: any = jwt.verify(token, accessTokenSecret as string);
			req.params.username = user.username;
		} catch (err: any | undefined) {
			logger.err("Error occured during authentication.");
			logger.err(err);
			res.sendStatus(401);
			return;
		}
		next();
	} else {
		res.sendStatus(401);
		return;
	}
};
