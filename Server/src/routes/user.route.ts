import { Request, Response, Router } from "express"
import { AuthenticationRequest, PasswordChangeRequest, UsernameChangeRequest } from "../models/api.website"
import { authenticateJWT, jsonParser } from "."
import UserService from "../services/user.service"
import { logger } from "../utils/logger"
import database from "../services/database.service"
import { User } from "@prisma/client"

export class UserRoute {
	public static path: string = "/user"
	private static instance: UserRoute
	private router = Router()

	private constructor() {
		this.router.get("", authenticateJWT, this.getUserList)
		this.router.post("", authenticateJWT, jsonParser, this.addNewUser)
		this.router.put("/password", authenticateJWT, jsonParser, this.changePassword)
		this.router.put("/name", authenticateJWT, jsonParser, this.changeUsername)
		this.router.delete("/:userId", authenticateJWT, this.deleteUser)
		// FIXME: This should be obtainable from the jwt so this could be deleted in the future.
		this.router.get("/whoAmI", authenticateJWT, (req, res) => {
			res.json(req.params.username)
		})
	}

	static get router() {
		if (!UserRoute.instance) {
			UserRoute.instance = new UserRoute()
		}
		return UserRoute.instance.router
	}

	/**
	 * Get a full list of users with their uid, username and password.
	 * @param _req
	 * @param res A response containing a list of ``User``.
	 * @returns Nothing
	 */
	private async getUserList(_req: Request, res: Response): Promise<void> {
		logger.info(`Getting the user list`)
		res.json((await database.users.getAll())?.map(user => ({ username: user.username })))
		return
	}

	/**
	 * Add a user with a certain username and initial password.
	 * @param req A request containing a ``AuthenticationRequestWebsite``.
	 * @param res
	 * @returns Nothing
	 */
	private async addNewUser(req: Request, res: Response): Promise<void> {
		const userData: AuthenticationRequest = req.body
		if (
			!userData //||!validateSchema(userData, AuthenticationRequestSchemaWebsite)
		) {
			res.sendStatus(400)
			return
		}

		const ret: User | null = await UserService.createUser(userData.username, userData.password)

		if (ret == null) {
			logger.error(`User was not created`)
			res.sendStatus(500)
		}

		res.sendStatus(200)
		return
	}

	/**
	 * Change a user's password.
	 * @param req A ``PasswordChangeWebsite`` with the old and a new password.
	 * @param res
	 * @returns Nothing
	 */
	private async changePassword(req: Request, res: Response): Promise<void> {
		const username: string = res.locals.username
		const userData: PasswordChangeRequest = req.body
		if (
			!userData //|| !validateSchema(userData, PasswordChangeSchemaWebsite
		) {
			res.sendStatus(400)
			return
		}

		const success: boolean = await UserService.updatePassword(username, userData)

		if (!success) {
			res.sendStatus(400)
			return
		}

		res.sendStatus(200)
		return
	}

	/**
	 * Change a users password.
	 * @param req A ``PasswordChangeWebsite`` with the old and a new password.
	 * @param res
	 * @returns Nothing
	 */
	private async changeUsername(req: Request, res: Response): Promise<void> {
		const username: string = res.locals.username
		const userData: UsernameChangeRequest = req.body
		if (!userData) {
			res.sendStatus(400)
			return
		}

		const success: boolean = await UserService.updateUsername(username, userData)

		if (!success) {
			res.sendStatus(500)
			return
		}

		res.sendStatus(200)
		return
	}

	/**
	 * Delete a user with a certain uid.
	 * @param req A request containing a userId in its parameters.
	 * @param res
	 * @returns Nothing
	 */
	private async deleteUser(req: Request, res: Response): Promise<void> {
		if (!res.locals || !res.locals.username) {
			res.sendStatus(400)
			return
		}
		const successful: boolean = await UserService.removeUser(res.locals.username)
		if (!successful) {
			res.sendStatus(500)
			return
		}
		res.sendStatus(200)
		return
	}
}
