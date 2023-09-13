import { NextFunction, Request, Response } from "express"
import { Prisma } from "@prisma/client"

export const mapPrismaErrorToHttpCodes = (err: Error, _req: Request, res: Response, next: NextFunction) => {
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		// Handle all P1... codes as Internal Server Error's
		if (err.code.startsWith("P1")) {
			res.sendStatus(500)
			return
		}
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
			res.sendStatus(500)
			return
		}
		// Treat rest of P2... error codes as Bad Requests
		if (err.code.startsWith("P2")) {
			res.sendStatus(400)
			return
		}
		// Treat all P3... as Internal Server Error's
		if (err.code.startsWith("P3")) {
			res.sendStatus(500)
			return
		}
		// Treat all P4... as Internal Server Error's
		if (err.code.startsWith("P4")) {
			res.sendStatus(500)
			return
		}
		// P5004 can be mostly accurately described as a Not Implemented
		if (err.code === "P5004") {
			res.sendStatus(501)
			return
		}
		// Treat rest of P5... error codes as Internal Server Error's
		if (err.code.startsWith("P5")) {
			res.sendStatus(500)
			return
		}
	}
	next()
}