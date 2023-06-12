import { Prisma, PrismaClient, Tracker } from "@prisma/client";
import { logger } from "../../utils/logger";

/**
 * TrackerController class
 *
 * Handles tracker specific access to the database.
 * @functons
 *      - save()
 *      - update()
 *      - remove()
 *      - getAll()
 *      - getById()
 *
 */
export default class TrackerController {

    constructor(private prisma: PrismaClient) {}


    /**
     * Saves a new tracker in the database.
     *
     * @param uid - ID (EUI) of the tracker.
     * @param data - optional additional data field.
     * @returns Tracker | null if an error occurs
     */
    public async save(uid: string, data?: JSON) : Promise<Tracker | null> {
        try {
            // TODO: vvv This
            let d = (data === undefined ? Prisma.JsonNull : JSON.parse(JSON.stringify(data))) as Prisma.InputJsonObject
            return await this.prisma.tracker.create({
                data : {
                    uid: uid,
                    data: d
                }
            })
        } catch(e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Updates a tracker in the database.
     *
     * @param uid - Indicator which tracker should be updated
     * @param data - New additional data field (Optional)
     * @returns Tracker | null if an error occurs
     */
    public async update(uid: string, data?: JSON) : Promise<Tracker | null> {
        try {
            // TODO: vvv This
            let d = (data === undefined ? Prisma.JsonNull : JSON.parse(JSON.stringify(data))) as Prisma.InputJsonObject
            return await this.prisma.tracker.update({
                where: {
                    uid: uid
                },
                data: {
                    data: d
                }
            })
        } catch(e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Removes a tracker from the database.
     *
     * @param uid - Indicator which tracker should be removed.
     * @returns True | False depending on if the tracker was removed or not.
     */
    public async remove(uid: string) : Promise<boolean> {
        try {
            await this.prisma.tracker.delete({
                where: {
                    uid: uid
                }
            })
            return true
        } catch(e) {
            logger.debug(e)
            return false
        }
    }

    /**
     * Returns a list of all trackers
     *
     * @returns Tracker[] - List of all trackers.
     */
    public async getAll() : Promise<Tracker[]> {
        try {
            return await this.prisma.tracker.findMany({})
        } catch(e) {
            logger.debug(e)
            return []
        }
    }

    /**
     * Looks up a tracker given by its uid.
     *
     * @param uid - Indicator which tracker should be looked up.
     * @returns Tracker | null depending on if the tracker could be found.
     */
    public async getById(uid: string) : Promise<Tracker | null> {
        try {
            return await this.prisma.tracker.findUnique({
                where: {
                    uid: uid
                }
            })
        } catch(e) {
            logger.debug(e)
            return null
        }
    }
}