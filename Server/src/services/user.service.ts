import { User } from "@prisma/client"
import { PasswordChangeRequest, UsernameChangeRequest } from "../models/api.website"
import { logger } from "../utils/logger"
import CryptoService from "./crypto.service"
import database from "./database.service"
import { z } from "zod"
import { HTTPError } from "../models/error"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"

/**
 * Service for user management
 */
export default class UserService {
	/**
	 * Create a new user
	 * @param name (unique) username of the new user
	 * @param password password of the new user
	 * @returns created `User` if successful
	 * @throws HTTPError if password could not be hashed or PrismaError if user could not be created
	 */
	public static async createUser(name: string, password: string): Promise<User> {
		// Pre-check whether a user with that username already exists, so we expect a prisma error to be thrown
		try {
			await database.users.getByUsername(name)
			throw new HTTPError("The user does already exist", 409)
		} catch (err) {
			// Throw if any other error than expected 'not found errors' are thrown
			if (!(err instanceof PrismaClientKnownRequestError) || !["P2001", "P2018", "P2021", "P2022", "P2025"].includes(err.code)) {
				throw err
			}
		}

		const hashed_pass: string = await CryptoService.produceHash(password)

		const addedUser: User = await database.users.save({ username: name, password: hashed_pass })
		logger.info(`User ${name} was successfully added`)
		return addedUser
	}

	/**
	 * Updates the password of a given user.
	 * @param username The username of the user that wants to change their password
	 * @param passwordChange The information containing the old and the new plain passwords
	 * @throws HTTPError if old password is incorrect or new password could not be hashed or PrismaError if user could not be updated
	 */
	public static async updatePassword(
		username: string,
		passwordChange: z.infer<typeof PasswordChangeRequest>
	): Promise<void> {
		const user: User = await database.users.getByUsername(username)

		if (!(await CryptoService.verify(user.password, passwordChange.oldPassword))) {
			throw new HTTPError("The old password is not correct", 400)
		}
		const hashedPassword: string = await CryptoService.produceHash(passwordChange.newPassword)

		await database.users.update(user.username, { password: hashedPassword })
	}

	/**
	 * Updates the username of a given user.
	 * @param username The username of the user that wants to change their password
	 * @param usernameChangeRequest The information containing the old and the new plain passwords
	 * @throws HTTPError if old username is incorrect or PrismaError if username could not be updated
	 */
	public static async updateUsername(
		username: string,
		usernameChangeRequest: z.infer<typeof UsernameChangeRequest>
	): Promise<void> {
		// Check if input was valid
		if (username !== usernameChangeRequest.oldUsername) {
			throw new HTTPError("Old username is incorrect", 400)
		}

		await database.users.update(usernameChangeRequest.oldUsername, {
			username: usernameChangeRequest.newUsername
		})

		logger.info(`Updated username of user ${usernameChangeRequest.oldUsername} 
            to ${usernameChangeRequest.newUsername}`)
	}
}
