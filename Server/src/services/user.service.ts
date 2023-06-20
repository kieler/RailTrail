import { User } from "../models";
import { PasswordChangeWebsite } from "../models/api.website";
import { logger } from "../utils/logger";
import { CryptoService } from "./crypto.service";
import { Database } from "./database.service";
import UserController from "./db/user.controller";

/**
 * Service for user management
 */
export default class UserService {
    private static controller: UserController = new Database().users;

    private static cryptoservice: CryptoService = new CryptoService();
    /**
     * Create a new user
     * @param name (unique) username of the new user
     * @param password password of the new user
     * @returns created `User` if successful, `null` otherwise
     */
    public static async createUser(
        name: string,
        password: string
    ): Promise<User | null> {
        const conflictingUser: User | null = await this.controller.getByUsername(name)
        if (conflictingUser) {
            logger.info(`User with username ${name} already exists`)
            return null
        }

        logger.info("Hashing password!");
        const hashed_pass: string | undefined = await this.cryptoservice.produceHash(
            password
        );

        if (hashed_pass) {
            // TODO: Check if this works when real implementation is there.
            const addedUser: User | null = await this.controller.save(name, hashed_pass)
            logger.info(`User ${name} was successfully added`)
            return addedUser
        } 
        logger.error(`Password could not be hashed`)
        return null
    }

    /**
     *
     * @param id id of the user
     * @returns `User` with id `id` or `null` if no user with `id` exists
     */
    public static async getUserById(id: number): Promise<User | null> {
        return this.controller.getById(id);
    }

    /**
     * Search for a user with username
     * @param name username of the user
     * @returns `User` with username `name` if it exists, `null` otherwise
     */
    public static async getUserByName(name: string): Promise<User | null> {
        return this.controller.getByUsername(name);
    }

    /**
     * Sets the users password
     * @param user `User` which gets a new password
     * @param password new hashed password
     * @returns `User` if successful, `null` otherwise
     */
    public static async setUserPassword(
        user: User,
        password: string
    ): Promise<User | null> {
        this.controller.update(user.uid, undefined, password)
        return user;
    }

    /**
     * Updates the password of a given user.
     * @param username The username of the user that wants to change their password
     * @param passwordChange The information containing the old and the new plain passwords
     * @returns `true`, if the password was successfully updated, `false` otherwise
     */
    public static async updatePassword(username : string, passwordChange: PasswordChangeWebsite): Promise<boolean> {
        const user: User | null = await this.getUserByName(username)
        if (!user) {
            return false
        }
        if (!await this.cryptoservice.verify(user.password, passwordChange.oldPassword)) {
            logger.err("The old password is not correct")
            return false
        }
        const hashedPassword: string | undefined = await this.cryptoservice.produceHash(passwordChange.newPassword)
        if (!hashedPassword) {
            logger.err("Hashing of password was not successful")
            return false
        }
        const successfulUpdate: User | null = await this.setUserPassword(user, hashedPassword)
        if (successfulUpdate) {
            logger.info(`Updated password of user ${username}`)
        } else {
            logger.error(`Updating password of user ${username} failed`)
        }
        return successfulUpdate != null
    }

    /**
     * Delete a user.
     * @param user `User` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */

    public static async removeUser(id:number, currentUsername : string): Promise<boolean> {
        const currentUser: User | null = await this.getUserByName(currentUsername)
        if (!currentUser) {
            logger.err(`Could not find current user with username ${currentUsername}.`)
            return false
        }     
        const userToBeDeleted: User | null = await this.getUserById(id)
        if (!userToBeDeleted) {
            logger.err(`Could not find the user to be deleted with id ${id}`)
            return false
        }   
        this.controller.remove(userToBeDeleted.uid)
        return true
    }

    /**
     * Get the full list of users.
     * @returns A full `User` list if successful, `null` otherwise.
     */
    public static async getAllUsers(): Promise<User[] | null> {
        return await this.controller.getAll();
    }
}
