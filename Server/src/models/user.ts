/**
 * User class
 *
 * This class is representing the user for the admin website and is used for authentication purposes.
 */
export class User {
	/**
	 * @param uid The index in the given database.
	 * @param username The given name for the user.
	 * @param password The hashed password of the user.
	 */
	constructor(
		// public uid: number,
		public username: string,
		public password: string
	) {}
}
