import { User } from "../models"
import { logger } from "../utils/logger"
import { Database } from "./database.service"
import UserController from "./db/user.controller"

/**
 * Service for user management
 */
export default class UserService{

    private static controller: UserController = new Database().users

    /**
     * Create a new user
     * @param name (unique) username of the new user
     * @param password password of the new user
     * @returns created `User` if successful, `null` otherwise
     */
    public static async createUser(name: string, password: string):Promise<User | null>{
        // TODO: implement, this is only generic
        return this.controller.save(name, password)
    }

    /**
     *
     * @param id id of the user
     * @returns `User` with id `id` or `null` if no user with `id` exists
     */
    public static async getUserById(id: number): Promise<User | null>{
        // TODO: implement, this is only generic
        return this.controller.getById(id)
    }

    /**
     * Search for a user with username
     * @param name username of the user
     * @returns `User` with username `name` if it exists, `null` otherwise
     */
    public static async getUserByName(name: string): Promise<User | null>{
        // TODO: implement, this is only generic
        return this.controller.getByUsername(name)
    }

    /**
     *
     * @param user `User` which gets a new name
     * @param name new username
     * @returns `User` if successful, `null` otherwise
     */
    public static async setUserName(user: User, name: string): Promise<User | null>{
        // TODO: implement
        return null
    }

    /**
     *
     * @param user `User` which gets a new password
     * @param password new password
     * @returns `User` if successful, `null` otherwise
     */
    public static async setUserPassword(user: User, password: string): Promise<User | null>{
        // TODO: implement
        return null
    }

    /**
     * Delete a user
     * @param user `User` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removeUser(user: User): Promise<boolean>{
        // TODO: implement, this is only generic
        this.controller.remove(user.uid)
        return false
    }
}