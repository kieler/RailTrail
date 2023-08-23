import { Request, Response, NextFunction } from "express"
import { logger } from "./logger"

/**
 * Express does not catch asynchronous exceptions automatically. They instead crash the server, which is a great design concept! /s
 *
 * To prevent that, we could update to Express 5 (currently in beta), or have to manually catch exceptions and pass them to the next-function.
 * For async-functions this function will wrap them automatically.
 * @param cb
 */
export default function please_dont_crash(cb: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
	return (req: Request, res: Response, next: NextFunction) => cb(req, res, next).catch((err) => {
		logger.error(err)
		next()
	})
}
