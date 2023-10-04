import * as argon from "argon2"
import { HTTPError } from "../models/error"

export default class CryptoService {
	/**
	 * Wrapper method for verifying a plain password against hashed password using argon2.
	 *
	 * @param hashedPassword The argon2-hashed password from the database to verify against.
	 * @param plainPassword The plain password the user entered.
	 */
	public static async verify(hashedPassword: string, plainPassword: string): Promise<boolean> {
		let isCorrectPassword: boolean
		try {
			isCorrectPassword = await argon.verify(hashedPassword, plainPassword)
		} catch (err) {
			throw new HTTPError("Could not verify password", 500)
		}
		return isCorrectPassword
	}

	/**
	 * Produces a hash using the argon hashing.
	 * @param input The password, that needs to be hashed
	 * @returns undefined, if the hashing is unsuccessful, a hash of the password otherwise.
	 */
	public static async produceHash(input: string): Promise<string> {
		try {
			return argon.hash(input)
		} catch (err) {
			throw new HTTPError("Could not hash password", 500)
		}
	}
}
