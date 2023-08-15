import winston from "winston"
import { config } from "../config/index"

const format = winston.format.combine(
	winston.format.colorize(),
	winston.format.timestamp(),
	winston.format.printf(({ timestamp, level, message }) => {
		return `${timestamp} ${level}: ${message}`
	})
)

export const logger = winston.createLogger({
	format: format,
	transports: [
		new winston.transports.Console({
			level: "silly"
		})
	]
})
