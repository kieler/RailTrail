import { NextFunction, Request, Response } from "express"
import { Prisma } from "@prisma/client"
import { HTTPError } from "../models/error"
import { ZodError } from "zod"
import { logger } from "../utils/logger"

export const mapErrorToHttpCodes = (err: Error, _req: Request, res: Response, next: NextFunction) => {
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		// Select some specific P2... error codes, that would rather be described as Not Found
		if (["P2001", "P2018", "P2021", "P2022", "P2025"].includes(err.code)) {
			res.sendStatus(404)
			return
		}

		// Select some specific P2... error codes, that would rather be described as Conflict
		if (["P2003", "P2014"].includes(err.code)) {
			res.sendStatus(409)
			return
		}

		// Select some specific P2... error codes, that would rather be described as Internal Server Error's
		if (["P2017", "P2023", "P2024", "P2028", "P2030", "P2031", "P2034"].includes(err.code)) {
			logger.error(`Internal Server Error (by Prisma): ${err.stack}`)
			res.sendStatus(500)
			return
		}

		// P5004 can be mostly accurately described as a Not Implemented
		if (err.code === "P5004") {
			logger.error(`Not Implemented Error (by Prisma): ${err.stack}`)
			res.sendStatus(501)
			return
		}

		// Treat rest of P2... error codes as Bad Requests
		if (err.code.startsWith("P2")) {
			res.sendStatus(400)
			return
		}

		// Handle P1, P3, P4, P5 codes as Internal Server Error's
		if (
			err.code.startsWith("P1") ||
			err.code.startsWith("P3") ||
			err.code.startsWith("P4") ||
			err.code.startsWith("P5")
		) {
			res.sendStatus(500)
			logger.error(`Internal Server Error (by Prisma): ${err.stack}`)
			return
		}
	}

	if (err instanceof ZodError) {
		res.status(400)
		res.send(err.message)
		return
	}

	if (err instanceof HTTPError) {
		res.status(err.statusCode)
		res.send(err.message)
		return
	}

	res.sendStatus(500)
	logger.error(`Unexpected error: ${err.stack}`)
	return
	next()
}
