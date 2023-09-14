import { AuthenticationRequest, AuthenticationResponse } from "../models/api.website"
import { logger } from "../utils/logger"
import * as jwt from "jsonwebtoken"

import { accessTokenSecret } from "../routes"
import database from "./database.service"
import CryptoService from "./crypto.service"
import { TokenPayload } from "../models/api"
import { User } from "@prisma/client"
import { z } from "zod"

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
	): Promise<z.infer<typeof AuthenticationResponse> | undefined> {
		const user: User | null = await database.users.getByUsername(auth.username)
		if (!user) {
			return
		}

		const hashedPassword: string = user.password
		if (!(await CryptoService.verify(hashedPassword, auth.password))) {
			return
		}

		const accessToken: string = jwt.sign({ username: user.username } as z.infer<typeof TokenPayload>, accessTokenSecret)
		logger.info(`User ${user.username} successfully logged in`)
		return { token: accessToken }
	}
}
