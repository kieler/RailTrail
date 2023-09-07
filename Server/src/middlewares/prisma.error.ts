import { NextFunction, Request, Response } from "express"
import { Prisma } from "@prisma/client"

export const mapPrismaErrorToHttpCodes = (err: Error, _req: Request, res: Response, next: NextFunction) => {
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		if (err.code.startsWith("P1")) {
			res.sendStatus(500)
			return
		}
		if (["P2001", "P2018", "P2021", "P2022", "P2025"].includes(err.code)) {
			res.sendStatus(404)
			return
		}
		if (["P2003", "P2014"].includes(err.code)) {
			res.sendStatus(409)
			return
		}
		if (["P2017", "P2023", "P2024", "P2028", "P2030", "P2031", "P2034"].includes(err.code)) {
			res.sendStatus(500)
			return
		}
		if (err.code.startsWith("P2")) {
			res.sendStatus(400)
			return
		}
		if (err.code.startsWith("P3")) {
			res.sendStatus(500)
			return
		}
		if (err.code.startsWith("P4")) {
			res.sendStatus(500)
			return
		}
		if (err.code === "P5004") {
			res.sendStatus(501)
			return
		}
		if (err.code.startsWith("P5")) {
			res.sendStatus(500)
			return
		}
	}
	next()
}