import { PrismaClient, Prisma } from '.prisma/client';
import type { POI, POIType } from '.prisma/client';
import { logger } from '../../utils/logger';

/**
 * POIController class
 *
 * Handles point of interest (POI) specific access to the database.
 * This controller handles therefore POIs and POITypes.
 * @functions for POITypes:
 *      - saveType()
 *      - updateType()
 *      - removeType()
 *      - getAllTypes()
 *      - getTypeById()
 *      - getTypeByName()
 *
 * @functions for POIs:
 *      - save()
 *      - update()
 *      - remove()
 *      - getAll()
 *      - getById()
 *      - getByName()
 *
 */
export default class POIController {

    constructor(private prisma: PrismaClient) {}

    // ========================================================= //
    // [POI Types]

    /**
     * Saves a type for POIs in the database.
     *
     * @param name - **unique** name of the type of poi.
     * @param icon - unique icon name for visualization
     * @param description - an optional description for the type of poi.
     * @returns POIType | null if an error occurs.
     */
    public async saveType(name: string, icon: string, description?: string): Promise<POIType | null> {
        try {
            return await this.prisma.pOIType.create({
                data : {
                    name: name,
                    icon: icon,
                    description: description
                }
            })
        } catch(e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Updates a type of poi in the database.
     *
     * @param uid - Indicator which type should be updated.
     * @param name - New name after change. (Optional)
     * @param icon - New unique icon name for visualization after change. (Optional)
     * @param description - New description after change. (Optional)
     * @returns POIType | null if an error occurs.
     */
    public async updateType(uid: number, name?: string, icon?: string, description?: string): Promise<POIType | null> {
        try {
            return await this.prisma.pOIType.update({
                where: {
                    uid: uid
                },
                data : {
                    name: name,
                    description: description
                }
            })
        } catch(e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Removes a poi type from the database.
     *
     * @param uid - Indicator which type should be removed.
     * @returns True | False depending on if the type was removed or not.
     */
    public async removeType(uid: number): Promise<boolean> {
        try {
            await this.prisma.pOIType.delete({
                where: {
                    uid: uid
                }
            });
            return true
        } catch(e) {
            logger.debug(e)
            return false
        }
    }

    /**
     * Returns a list of all existing types of poi.
     *
     * @returns `POIType[]` - List of all types of poi.
     */
    public async getAllTypes(): Promise<POIType[]> {
        try {
            return await this.prisma.pOIType.findMany({});
        } catch(e) {
            logger.debug(e)
            return []
        }
    }

    /**
     * Looks up a type given by its uid.
     *
     * @param uid - Indicator which type should be searched for.
     * @returns POIType | null depending on if the type could be found.
     */
    public async getTypeById(uid: number): Promise<POIType | null> {
        try {
            return await this.prisma.pOIType.findUnique({
                where: {
                    uid: uid
                }
            });
        } catch(e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Looks up a type given by its name.
     *
     * @param name - Indicator which type should be searched for.
     * @returns POIType | null depending on if the type could be found.
     */
    public async getTypeByName(name: string): Promise<POIType | null> {
        try {
            return await this.prisma.pOIType.findUnique({
                where: {
                    name: name
                }
            });
        } catch(e) {
            logger.debug(e)
            return null
        }
    }

    // ========================================================= //
    // [POI]

    /**
     * Saves a point of interest (POI) in the database.
     *
     * @param name - **unique** name of the POI
     * @param typeId - POIType Identifier: Maps a POIType to said POI in the database
     * @param trackId - Track Identifier : Maps a Track to said POI in the database
     * @param position - Coordinates to pinpoint the location of said POI.
     * @param description - optional description of said POI
     * @param isTurningPoint - optional indicator whether it is possible to turn a vehicle around at this POI
     * @returns POI | null if an error occurs.
     */
    public async save(name: string, typeId: number, trackId: number, position: JSON, description?: string, isTurningPoint : boolean = false): Promise<POI | null> {
        try {
            return await this.prisma.pOI.create({
                data: {
                    name: name,
                    description: description,
                    typeId: typeId,
                    trackId: trackId,
                    position: (position as unknown as Prisma.InputJsonValue),
                    isTurningPoint: isTurningPoint
                }
            })
        } catch(e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Updates a POI in the database.
     *
     * @param uid - Indicator which poi should be updated.
     * @param name - New name after change. (Optional)
     * @param description - New description after change. (Optional)
     * @param typeId - New typeId after change. (Optional)
     * @param trackId - New trackId after change. (Optional)
     * @param position - New position after change. (Optional)
     * @param isTurningPoint - indicator whether it is possible to turn a vehicle around at this POI (Optional)
     * @returns POI | null if an error occurs.
     */
    public async update(uid: number, name?: string, description?: string, typeId?: number, trackId?: number, position?: JSON, isTurningPoint?: boolean): Promise<POI | null> {
        try {
            return await this.prisma.pOI.update({
                where: {
                    uid: uid
                },
                data: {
                    name: name,
                    description: description,
                    typeId: typeId,
                    trackId: trackId,
                    position: (position as unknown as Prisma.InputJsonValue),
                    isTurningPoint: isTurningPoint
                }
            })
        } catch(e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Removes an poi from the database.
     *
     * @param uid - Indicator which poi should be removed.
     * @returns True | False depending on if the user was removed or not.
     */
    public async remove(uid: number): Promise<boolean> {
        try {
            await this.prisma.pOI.delete({
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
     * Returns a list of all existing pois.
     *
     * @param trackId - Indicator for filtering all pois for a specific track (Optional)
     * @returns POI[] - List of all pois. If an trackId was given: List of all pois on this specific track.
     */
    public async getAll(trackId? : number): Promise<POI[]> {
        try {
            return await this.prisma.pOI.findMany({
                where: {
                    trackId: trackId
                }
            })
        } catch(e) {
            logger.debug(e)
            return []
        }
    }

    /**
     * Looks up a poi given by its uid.
     *
     * @param uid - Indicator which poi should be searched for
     * @returns POI | null depending on if the poi could be found.
     */
    public async getById(uid: number): Promise<POI | null> {
        try {
            return await this.prisma.pOI.findUnique({
                where: {
                    uid: uid
                },
                include: {
                    type: true,
                    track: true
                }
            })
        } catch(e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Looks up pois given by its name.
     *
     * @param name - Indicator which pois should be searched for
     * @param trackId - optional filter indicator to filter for a given track.
     * @returns POI[] - List of all pois with the given name. If an trackId was given: List of all pois on this specific track with the given name.
     */
    public async getByName(name: string, trackId?: number): Promise<POI[]> {
        try {
            return await this.prisma.pOI.findMany({
                where: {
                    name: name,
                    trackId: trackId
                },
            });
        } catch(e) {
            logger.debug(e)
            return []
        }
    }
}