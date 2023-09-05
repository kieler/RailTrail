import { User } from "@prisma/client"
import { PasswordChangeRequest, UsernameChangeRequest } from "../models/api.website"
import { logger } from "../utils/logger"
import CryptoService from "./crypto.service"
import database from "./database.service"

/**
 * Service for user management
 */
export default class UserService {
	/**
	 * Create a new user
	 * @param name (unique) username of the new user
	 * @param password password of the new user
	 * @returns created `User` if successful, `null` otherwise
	 */
	public static async createUser(name: string, password: string): Promise<User | null> {
		const conflictingUser: User | null = await database.users.getByUsername(name)
		if (conflictingUser) {
			logger.info(`User with username ${name} already exists`)
			return null
		}

		logger.info("Hashing password!")
		const hashed_pass: string | undefined = await CryptoService.produceHash(password)

		if (!hashed_pass) {
			logger.error(`Password could not be hashed`)
			return null
		}
		const addedUser: User | null = await database.users.save({ username: name, password: hashed_pass })
		logger.info(`User ${name} was successfully added`)
		return addedUser
	}

	/**
	 * Updates the password of a given user.
	 * @param username The username of the user that wants to change their password
	 * @param passwordChange The information containing the old and the new plain passwords
	 * @returns `true`, if the password was successfully updated, `false` otherwise
	 */
	public static async updatePassword(username: string, passwordChange: PasswordChangeRequest): Promise<boolean> {
		const user: User | null = await database.users.getByUsername(username)
		if (!user) {
			return false
		}
		logger.info(`User: ${user.username}, Password: ${user.password}, oldPassword: ${passwordChange.oldPassword}`)
		if (!(await CryptoService.verify(user.password, passwordChange.oldPassword))) {
			logger.error("The old password is not correct")
			return false
		}
		const hashedPassword: string | undefined = await CryptoService.produceHash(passwordChange.newPassword)
		if (!hashedPassword) {
			logger.error("Hashing of password was not successful")
			return false
		}
		const successfulUpdate: User | null = await database.users.update(user.username, { password: hashedPassword })
		if (successfulUpdate) {
			logger.info(`Updated password of user ${username}`)
		} else {
			logger.error(`Updating password of user ${username} failed`)
		}
		return successfulUpdate != null
	}

	/**
	 * Updates the username of a given user.
	 * @param username The username of the user that wants to change their password
	 * @param usernameChangeRequest The information containing the old and the new plain passwords
	 * @returns `true`, if the password was successfully updated, `false` otherwise
	 */
	public static async updateUsername(username: string, usernameChangeRequest: UsernameChangeRequest): Promise<boolean> {
		// Check if input was valid
		if (username !== usernameChangeRequest.oldUsername) {
			return false
		}
		if (usernameChangeRequest.newUsername !== "") {
			return false
		}

		// Check if user exists.
		const user: User | null = await database.users.getByUsername(usernameChangeRequest.oldUsername)
		if (!user) {
			return false
		}

		const successfulUpdate: User | null = await database.users.update(user.username, {
			username: usernameChangeRequest.newUsername
		})
		if (!successfulUpdate) {
			logger.error(`Updating username of user ${usernameChangeRequest.oldUsername} to new username
            ${usernameChangeRequest.newUsername} failed`)
			return false
		}

		logger.info(`Updated username of user ${usernameChangeRequest.oldUsername} 
            to ${usernameChangeRequest.newUsername}`)
		return true
	}

	/**
	 * Delete a user.
	 * @param name `User` to delete
	 * @returns `true` if deletion was successful, `false` otherwise
	 */
	public static async removeUser(name: string): Promise<boolean> {
		const currentUser: User | null = await database.users.getByUsername(name)
		if (!currentUser) {
			logger.error(`Could not find current user with username ${name}.`)
			return false
		}
		const userToBeDeleted: User | null = await database.users.getByUsername(name)
		if (!userToBeDeleted) {
			logger.error(`Could not find the user to be deleted with name ${name}.`)
			return false
		}

		const successful: boolean = await database.users.remove(userToBeDeleted.username)
		if (!successful.valueOf()) {
			logger.error(`Could not remove user with username ${name}.`)
			return false
		}

		logger.info(`Successfully removed user with username ${name}.`)
		return true
	}
}
