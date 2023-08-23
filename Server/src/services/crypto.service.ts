import * as argon from "argon2"
import {logger} from "../utils/logger";

export default class CryptoService {
	public static async verify(hashedPassword: string, plainPassword: string): Promise<boolean> {
		let isCorrectPassword: boolean = false
		try {
			isCorrectPassword = await argon.verify(hashedPassword, plainPassword)
			if (!isCorrectPassword) {
				logger.info('Verification failed')
			}
		} catch (err) {
			isCorrectPassword = false
		}
		return isCorrectPassword
	}
	/**
	 * Produces a hash using the argon hashing.
	 * @param input The password, that needs to be hashed
	 * @returns Undefined, if the hashing is unsuccessful, a hash of the password otherwise.
	 */
	public static async produceHash(input: string): Promise<string | undefined> {
		try {
			return argon.hash(input)
		} catch (err) {
			return
		}
	}
}
