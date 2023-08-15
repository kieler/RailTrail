import { PrismaClient, Prisma } from '@prisma/client';
import type { POI, POIType } from '@prisma/client';

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
     * The parameter are given via object deconstruction from the model `POIType`!
     * Currently given parameters are:
     * @param name - **unique** name of the type of poi.
     * @param icon - unique icon name for visualization
     * @param description - an optional description for the type of poi.
     * @returns POIType
     */
    public async saveType(args : Prisma.POITypeCreateInput): Promise<POIType> {
        return await this.prisma.pOIType.create({
            data : args
        })
    }

    /**
     * Updates a type of poi in the database.
     *
     * @param uid - Indicator which type should be updated.
     *
     * The parameter are given via object deconstruction from the model `POIType`!
     * Currently given parameters are:
     * @param name - New name after change. (Optional)
     * @param icon - New unique icon name for visualization after change. (Optional)
     * @param description - New description after change. (Optional)
     * @returns POIType | null if an error occurs.
     */
    public async updateType(uid: number, args : Prisma.POITypeUpdateInput): Promise<POIType | null> {
        return await this.prisma.pOIType.update({
            where: {
                uid: uid
            },
            data : args
        })
    }

    /**
     * Removes a poi type from the database.
     *
     * @param uid - Indicator which type should be removed.
     */
    public async removeType(uid: number): Promise<void> {
        await this.prisma.pOIType.delete({
            where: {
                uid: uid
            }
        })
    }

    /**
     * Returns a list of all existing types of poi.
     *
     * @returns `POIType[]` - List of all types of poi.
     */
    public async getAllTypes(): Promise<POIType[]> {
        return await this.prisma.pOIType.findMany({});
    }

    /**
     * Looks up a type given by its uid.
     *
     * @param uid - Indicator which type should be searched for.
     * @returns POIType | null depending on if the type could be found.
     */
    public async getTypeById(uid: number): Promise<POIType | null> {
        return await this.prisma.pOIType.findUnique({
            where: {
                uid: uid
            }
        })
    }

    /**
     * Looks up a type given by its name.
     *
     * @param name - Indicator which type should be searched for.
     * @returns POIType | null depending on if the type could be found.
     */
    public async getTypeByName(name: string): Promise<POIType | null> {
        return await this.prisma.pOIType.findUnique({
            where: {
                name: name
            }
        })
    }

    // ========================================================= //
    // [POI]

    /**
     * Saves a point of interest (POI) in the database.
     *
     * The parameter are given via object deconstruction from the model `POI`!
     * Currently given parameters are:
     * @param name - **unique** name of the POI
     * @param typeId - POIType Identifier: Maps a POIType to said POI in the database
     * @param trackId - Track Identifier : Maps a Track to said POI in the database
     * @param position - Coordinates to pinpoint the location of said POI.
     * @param description - optional description of said POI
     * @param isTurningPoint - optional indicator whether it is possible to turn a vehicle around at this POI
     * @returns POI
     */
    public async save(args : Prisma.POIUncheckedCreateInput): Promise<POI> {
        // POIUncheckCreateInput is used because of required relations based on the model!
        return await this.prisma.pOI.create({
            data: args
        })
    }

    /**
     * Updates a POI in the database.
     *
     * @param uid - Indicator which poi should be updated.
     *
     * The parameter are given via object deconstruction from the model `POI`!
     * Currently given parameters are:
     * @param name - New name after change. (Optional)
     * @param description - New description after change. (Optional)
     * @param typeId - New typeId after change. (Optional)
     * @param trackId - New trackId after change. (Optional)
     * @param position - New position after change. (Optional)
     * @param isTurningPoint - indicator whether it is possible to turn a vehicle around at this POI (Optional)
     * @returns POI
     */
    public async update(uid: number, args : Prisma.POIUpdateInput): Promise<POI> {
        return await this.prisma.pOI.update({
            where: {
                uid: uid
            },
            data: args
        })
    }

    /**
     * Removes an poi from the database.
     *
     * @param uid - Indicator which poi should be removed.
     */
    public async remove(uid: number): Promise<void> {
        await this.prisma.pOI.delete({
            where: {
                uid: uid
            }
        })
    }

    /**
     * Returns a list of all existing pois.
     *
     * @param trackId - Indicator for filtering all pois for a specific track (Optional)
     * @returns POI[] - List of all pois. If an trackId was given: List of all pois on this specific track.
     */
    public async getAll(trackId? : number): Promise<POI[]> {
        return await this.prisma.pOI.findMany({
            where: {
                trackId: trackId
            }
        })
    }

    /**
     * Looks up a poi given by its uid.
     *
     * @param uid - Indicator which poi should be searched for
     * @returns POI | null depending on if the poi could be found.
     */
    public async getById(uid: number): Promise<POI | null> {
        return await this.prisma.pOI.findUnique({
            where: {
                uid: uid
            },
            include: {
                type: true,
                track: true
            }
        })
    }

    /**
     * Looks up pois given by its name.
     *
     * @param name - Indicator which pois should be searched for
     * @param trackId - optional filter indicator to filter for a given track.
     * @returns POI[] - List of all pois with the given name. If an trackId was given: List of all pois on this specific track with the given name.
     */
    public async getByName(name: string, trackId?: number): Promise<POI[]> {
        return await this.prisma.pOI.findMany({
            where: {
                name: name,
                trackId: trackId
            },
        })
    }
}