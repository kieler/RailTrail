import { Log, PrismaClient, Prisma } from "@prisma/client";
import { logger } from "../../utils/logger";

/**
 * LogController class
 *
 * Handles (tracker) log specific access to the database.
 * @functions
 *      - save()
 *      - update()
 *      - remove()
 *      - getAll()
 *      - getLog()
 *
 */
export default class LogController {

    constructor(private prisma: PrismaClient) {}

    /**
     * Saves a new log in the database.
     *
     * @param timestamp - Time of log.
     * @param trackerId - Tracker.uid which caused the log.
     * @param position - Current GPS position at the time of the creation of the log.
     * @returns Log | null if an error occurs.
     */
    public async save(timestamp : Date, trackerId: number, position: JSON) : Promise<Log | null> {
        try {
            // TODO: vvv This.
            let pos = JSON.parse(JSON.stringify(position)) as Prisma.InputJsonObject
            return await this.prisma.log.create({
                data : {
                    timestamp: timestamp,
                    trackerId: trackerId,
                    position: pos
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Updadtes a log in the database
     *
     * @param timestamp - Time of log which should be updated. (Key Pair with trackeId)
     * @param trackerId - Tracker.uid of Log which should be updated. (Key Pair with timestamp)
     * @param position - New position after change (optional)
     * @returns Log | null if an error occurs.
     */
    public async update(timestamp : Date, trackerId: number, position?: JSON) : Promise<Log | null> {
        try {
            // TODO: vvv This.
            let pos = JSON.parse(JSON.stringify(position)) as Prisma.InputJsonObject
            return await this.prisma.log.update({
                where: {
                    timestamp_trackerId: {
                        timestamp: timestamp,
                        trackerId: trackerId
                    }
                },
                data : {
                    position: pos
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Removes a log from the database.
     *
     * @param timestamp - Time of log which should be updated. (Key Pair with trackeId)
     * @param trackerId - Tracker.uid of Log which should be updated. (Key Pair with timestamp)
     * @returns True | False depending on if the log could be removed.
     */
    public async remove(timestamp : Date, trackerId: number) : Promise<Boolean> {
        try {
            await this.prisma.log.delete({
                where: {
                    timestamp_trackerId: {
                        timestamp: timestamp,
                        trackerId: trackerId
                    }
                }
            })
            return true
        } catch (e) {
            logger.debug(e)
            return false
        }
    }

    /**
     * Return a list of all logs.
     * If a trackerId is given the list will be filtered for this specific tracker.
     *
     * @param trackerId - Tracker to filter for (Optional)
     * @returns Log[] - List of all logs
     */
    public async getAll(trackerId?: number) : Promise<Log[]> {
        try {
            return await this.prisma.log.findMany({
                where: {
                    trackerId: trackerId
                }
            })
        } catch (e) {
            logger.debug(e)
            return []
        }
    }

    /**
     * Looks up a specific log in the database.
     *
     * @param timestamp - Time of log which should be updated. (Key Pair with trackeId)
     * @param trackerId - Tracker.uid of Log which should be updated. (Key Pair with timestamp)
     * @returns Log | null depending on if the log could be found.
     */
    public async getLog(timestamp : Date, trackerId: number) : Promise<Log | null> {
        try {
            return await this.prisma.log.findUnique({
                where: {
                    timestamp_trackerId: {
                        timestamp: timestamp,
                        trackerId: trackerId
                    }
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }
}