import { Request, Response, Router } from "express"
import { AuthenticationRequest, PasswordChangeRequest, UsernameChangeRequest } from "../models/api.website"
import { authenticateJWT, jsonParser } from "."
import UserService from "../services/user.service"
import { logger } from "../utils/logger"
import database from "../services/database.service"
import please_dont_crash from "../utils/please_dont_crash"

export class UserRoute {
	public static path: string = "/user"
	private static instance: UserRoute
	private router = Router()

	private constructor() {
		this.router.get("", authenticateJWT, please_dont_crash(this.getUserList))
		this.router.post("", authenticateJWT, jsonParser, please_dont_crash(this.addNewUser))
		this.router.put("/password", authenticateJWT, jsonParser, please_dont_crash(this.changePassword))
		this.router.put("/name", authenticateJWT, jsonParser, please_dont_crash(this.changeUsername))
		this.router.delete("/:userName", authenticateJWT, please_dont_crash(this.deleteUser))
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
		const userPayload = AuthenticationRequest.parse(req.body)

		await UserService.createUser(userPayload.username, userPayload.password)

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

		const passwordPayload = PasswordChangeRequest.parse(req.body)

		await UserService.updatePassword(username, passwordPayload)

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

		const usernamePayload = UsernameChangeRequest.parse(req.body)

		await UserService.updateUsername(username, usernamePayload)

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
		if (!req.params.userName) {
			logger.error(`No username was given for delete request`)
			res.sendStatus(400)
			return
		}
		// We always want to have at least one user being able to access the website. That is why we don't allow users to
		// delete themselves.
		const username: string = req.params.userName
		if (username === res.locals.username) {
			logger.error(`User with username ${username} tried deleting themself.`)
			res.sendStatus(400)
			return
		}

		await database.users.remove(username)
		res.sendStatus(200)
		return
	}
}
