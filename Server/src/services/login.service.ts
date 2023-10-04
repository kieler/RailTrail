import { AuthenticationRequest, AuthenticationResponse } from "../models/api.website"
import { logger } from "../utils/logger"
import * as jwt from "jsonwebtoken"

import { accessTokenSecret } from "../routes"
import database from "./database.service"
import CryptoService from "./crypto.service"
import { TokenPayload } from "../models/api"
import { User } from "@prisma/client"
import { z } from "zod"
import { HTTPError } from "../models/error"

/**
 * A class that manages the users.
 */
export default class LoginService {
	/**
	 * Login process for a user that is already in the database.
	 * @param auth The authentication details.
	 * @returns A jsonwebtoken if login successful, undefined otherwise.
	 */
	public static async login(
		auth: z.infer<typeof AuthenticationRequest>
	): Promise<z.infer<typeof AuthenticationResponse>> {
		const user: User = await database.users.getByUsername(auth.username)

		if (!(await CryptoService.verify(user.password, auth.password))) {
			throw new HTTPError("Invalid credentials", 401)
		}

		const accessToken: string = jwt.sign(
			{ username: user.username } as z.infer<typeof TokenPayload>,
			accessTokenSecret,
			{ expiresIn: "24h" } as jwt.SignOptions
		)
		logger.info(`User ${user.username} successfully logged in`)
		return { token: accessToken }
	}
}
