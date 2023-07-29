import { PrismaClient, Prisma } from "@prisma/client";
import type { Track } from '@prisma/client';
import { logger } from "../../utils/logger";

/**
 * TrackController class
 *
 * Handles track specific access to the database.
 * @function    - save()
 *              - update()
 *              - remove()
 *              - getAll()
 *              - getById()
 *              - getByStop()
 *
 */
export default class TrackController {

    constructor(private prisma: PrismaClient) {}

    /**
     * Saves a tracker in the database.
     *
     * @param start - Name of the start location.
     * @param stop - Name of the end location.
     * @param data - JSON Data of the track
     * @returns Track | null if an error occurs
     */
    public async save(start: string, stop: string, data: JSON) : Promise<Track | null> {
        try {
            return await this.prisma.track.create({
                data : {
                    start: start,
                    stop: stop,
                    data: (data as unknown as Prisma.InputJsonValue)
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Updates a track in the database.
     *
     * @param uid - Indicator which track should be updated
     * @param start - New name of the start location after change (Optional)
     * @param stop - New name of the end location after change (Optional)
     * @param data - New JSON Data of the track after change (Optional)
     * @returns Track | null if an error occurs
     */
    public async update(uid: number, start?: string, stop?: string, data?: JSON) : Promise<Track | null>{
        try {
            return await this.prisma.track.update({
                where: {
                    uid: uid
                },
                data : {
                    start: start,
                    stop: stop,
                    data: (data as unknown as Prisma.InputJsonValue)
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Removes a track in the database.
     *
     * @param uid - Indicator which track should be removed.
     * @returns True | False depending on if the track was removed or not.
     */
    public async remove(uid: number) : Promise<boolean> {
        try {
            await this.prisma.track.delete({
                where: {
                    uid: uid
                }
            })
            return true
        } catch (e) {
            logger.debug(e)
            return false
        }
    }

    /**
     * Returns a list of all tracks.
     *
     * @returns Track[] - List of all tracks.
     */
    public async getAll() : Promise<Track[]> {
        try {
            return await this.prisma.track.findMany({})
        } catch (e) {
            logger.debug(e)
            return []
        }
    }

    /**
     * Looks up a track given by its uid.
     *
     * @param uid - Indicator which track should be searched for.
     * @returns Track | null depending on if the track could be found.
     */
    public async getById(uid: number) : Promise<Track | null> {
        try {
            return await this.prisma.track.findUnique({
                where: {
                    uid: uid
                },
                include: {
                    poi: true,
                    vehicle: true
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Looks up any track that has a start or stop at the given location.
     *
     * @param location - Name of the location to check.
     * @returns Track[] - List of tracks that have either start and/or stop at the given location.
     */
    public async getByLocation(location: string) : Promise<Track[]> {
        try {
            return await this.prisma.track.findMany({
                where : {
                    OR : [
                        {
                            start: location
                        },
                        {
                            stop: location
                        }
                    ],
                },
                include: {
                    poi: true,
                    vehicle: true
                }
            })
        } catch (e) {
            logger.debug(e)
            return []
        }
    }
}