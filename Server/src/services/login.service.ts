import { AuthenticationRequest, AuthenticationResponse } from "../models/api.website"
import { logger } from "../utils/logger"
import * as jwt from "jsonwebtoken"

import { accessTokenSecret } from "../routes"
import database from "./database.service"
import CryptoService from "./crypto.service"
import { TokenPayload } from "../models/api"
import { User } from "@prisma/client"

/**
 * A class that manages the users.
 */
export default class LoginService {
	/**
	 * Login process for a user that is already in the database.
	 * @param auth The authentication details.
	 * @returns A jsonwebtoken if login successful, undefined otherwise.
	 */
	public static async login(auth: AuthenticationRequest): Promise<AuthenticationResponse | undefined> {
		const user = await database.users.getByUsername(auth.username)
		if (!user) {
			return
		}

		const hashedPassword: string = user.password
		if (!(await CryptoService.verify(hashedPassword, auth.password))) {
			return
		}

		const accessToken = jwt.sign({ username: user.username } as TokenPayload, accessTokenSecret)
		logger.info(`User ${user.username} successfully logged in`)
		return { token: accessToken }
	}

	/**
	 * Sign up process. This should only be possible for testing and adding users.
	 * @param auth The authentication information from the request
	 * @returns An AuthenticationResponse with a session token or undefined, if something went wrong.
	 */
	public static async signup(auth: AuthenticationRequest): Promise<AuthenticationResponse | undefined> {
		const user: User | null = await database.users.getByUsername(auth?.username)
		// Might add something such that this is only possible if no user is registered yet

		if (user || !auth.username || !auth.password) {
			logger.error("There is already a user with that username or the user data was not complete.")
			return
		}
		logger.info("Hashing password!")
		const hashed_pass: string | undefined = await CryptoService.produceHash(auth.password)
		if (!hashed_pass) {
			return
		}
		const createdUser: User | null = await database.users.save({ username: auth.username, password: hashed_pass })
		if (!createdUser) {
			return
		}

		const accessToken: string = jwt.sign({ username: auth.username } as TokenPayload, accessTokenSecret)
		logger.info(`User ${auth.username} successfully signed in`)
		return { token: accessToken }
	}
}
