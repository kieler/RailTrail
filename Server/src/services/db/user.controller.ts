import { Pool } from 'pg';
import { User } from '../../models/user';

/**
 * UserController class
 * 
 * This controller handles the user specific data.
 * @functions   - save()
 *              - getById()
 *              - getById()
 *              - getByUsername()
 *              - remove()
 */
export default class UserController {

    /**
     * This constructor makes sure that the specific table exists.
     * If the table `users` does not exist it will be created.
     * @param pool connection to the database
     */
    constructor(private pool: Pool) {
        let sql = 'CREATE TABLE IF NOT EXISTS users(uid UUID PRIMARY KEY, username VARCHAR(256), password VARCHAR(256))'

        this.pool.query(sql)

    }

    /**
     * Adds user to the database.
     * @param username Username of the user.
     * @param password **hashed** password of the user.
     * @throws `Error` if the data is invalid (e.g. the username is already taken)
     * @returns @class `User`
     */
    public save(username: string, password: string): User {
        // > This is currently a placeholder <
        return new User(1337, "RailTrail", "123456")
    }

    /**
     * Search user via uid.
     * 
     * @param uid The unique index of the user.
     * @returns @class `User` | `null` if the user couldn't be found.
     */
    public getById(uid: number): User | null {
        // > This is currently a placeholder <
        return new User(1337, "RailTrail", "123456")
    }

    /**
     * Search user via username.
     * @param username The username of the user.
     * @returns @class `User` | `null` if the user couldn't be found.
     */
    public getByUsername(username: string): User | null {
        // > This is currently a placeholder <
        return new User(1337, "RailTrail", "123456")
    }

    /**
     * Removes a user from the database.
     * @param user the user who should be removed.
     * @throws `Error` if the data is invalid or the removeable could not be processed.
     */
    public remove(user: User): void {

    }
}