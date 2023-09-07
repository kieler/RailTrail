import express, { Application } from "express"

import { ApiRoutes } from "./routes"
import { morganMiddleware } from "./middlewares/morgan.middleware"
import { mapPrismaErrorToHttpCodes } from "./middlewares/prisma.error"

/**
 * Server class
 *
 * This class represents the general server written with express and
 * initializes the database and the routes in a structured manner.
 */
export class Server {
	public app: Application = express()

	constructor() {
		this.app.use(mapPrismaErrorToHttpCodes)
		this.app.use(morganMiddleware) //request logging
		this.app.use(ApiRoutes.path, ApiRoutes.router)
	}
}
