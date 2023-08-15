import { config } from "./config"
import { Server } from "./server"
import { logger } from "./utils/logger"

logger.info(`Starting server on port ${config.SERVER_PORT}`)
export const app = new Server().app
export const server = app.listen(config.SERVER_PORT)
logger.info("Started server successfully")

process.on("SIGTERM", () => {
	logger.info("SIGTERM signal received: closing HTTP server")
	server.close(() => {
		logger.info("HTTP server closed")
	})
})
