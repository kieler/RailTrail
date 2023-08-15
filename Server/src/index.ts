import { Server } from "./server"
import { logger } from "./utils/logger"
import dotenv from "dotenv"

// Import variables from .env into process.env
dotenv.config()
const config = process.env

logger.info(`Starting server on port ${config.SERVER_PORT}`)
const app = new Server().app
const server = app.listen(config.SERVER_PORT)
logger.info("Started server successfully")

process.on("SIGTERM", () => {
	logger.info("SIGTERM signal received: closing HTTP server")
	server.close(() => {
		logger.info("HTTP server closed")
	})
})
