import { PrismaClient, Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import { logger } from '../../utils/logger';

/**
 * UserController class
 *
 * Handles user specific access to the database.
 * @functions   - save()
 *              - update()
 *              - remove()
 *              - getAll()
 *              - getById()
 *              - getByUsername()
 */
export default class UserController {

    constructor(private prisma: PrismaClient) {}

    /**
     * Saves an user in the database.
     *
     * @param username - **unique** name of the user.
     * @param password - **hashed** password.
     * @returns User | null if an error occurs.
     */
    public async save(username: string, password: string): Promise<User | null> {
        try {
            return await this.prisma.user.create({
                data : {
                    username: username,
                    password: password
                }
            });
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Updates an user in the database.
     *
     * @param uid - Indicator which user should be updated
     * @param username - New username after change. (Optional)
     * @param password - New password after change. (Optional)
     * @returns User | null if an error occurs.
     */
    public async update(uid : number, username?: string, password?: string) : Promise<User | null> {
        try {
            return await this.prisma.user.update({
                where: {
                    uid: uid
                },
                data : {
                    username: username,
                    password: password
                }
            });
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Removes an user from the database.
     *
     * @param uid - Indicator which user should be removed.
     * @returns True | False depending on if the user was removed or not.
     */
    public async remove(uid : number ) : Promise<Boolean> {
        try {
            await this.prisma.user.delete({
                where: {
                    uid: uid
                }
            });
            return true
        } catch (e) {
            logger.debug(e)
            return false
        }
    }

    /**
     * Returns a list of all existing users.
     *
     * @returns `User[]` - List of all users.
     */
    public async getAll() : Promise<User[]> {
        try {
            return await this.prisma.user.findMany({});
        } catch (e) {
            logger.debug(e)
            return []
        }
    }

    /**
     * Looks up an user given by its uid.
     *
     * @param uid - Indicator which user should be searched for
     * @returns User | null depending on if the user could be found.
     */
    public async getById(uid : number ) : Promise<User | null> {
        try {
            return await this.prisma.user.findUnique({
                where: {
                    uid: uid
                }
            });
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Looks up an user given by its username.
     *
     * @param username - Indicator which user should be searched for
     * @returns User | null depending on if the user could be found.
     */
    public async getByUsername(username : string) : Promise<User | null> {
        try {
            return await this.prisma.user.findUnique({
                where: {
                    username: username
                }
            });
        } catch (e) {
            logger.debug(e)
            return null
        }
    }
}