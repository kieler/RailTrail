import { PrismaClient, Prisma } from "@prisma/client";
import type { Vehicle, VehicleType } from '@prisma/client';
import { logger } from "../../utils/logger";

/**
 * VehicleController class
 *
 * Handles vehicle specific access to the datbase.
 * This controller handles therefore Vehicles and VehicleTypes.
 *  @functions for VehicleTypes:
 *      - saveType()
 *      - updateType()
 *      - removeType()
 *      - getAllTypes()
 *      - getTypeById()
 *      - getTypeByName()
 *  @functions for Vehicles:
 *      - save()
 *      - update()
 *      - remove()
 *      - getAll()
 *      - getById()
 *      - getByName()
 */
export default class VehicleController {

    constructor(private prisma: PrismaClient) {}

    // ========================================================= //
    // [Vehicle Types]

    /**
     * Saves a vehicle type in the database.
     *
     * @param name - **unique** Name for the type of vehicle.
     * @param description - optional description for the type.
     * @returns VehicleType | null if an error occurs
     */
    public async saveType(name: string, description?: string) : Promise<VehicleType | null> {
        try {
            return await this.prisma.vehicleType.create({
                data : {
                    name : name,
                    description: description
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Updates a vehicle type in the database.
     *
     * @param uid - Indicator which vehicle type should be updated.
     * @param name - New name of the vehicle type after change. (Optional)
     * @param description - New description of the vehicle type after change. (Optional)
     * @returns
     */
    public async updateType(uid: number, name?: string, description?: string) : Promise<VehicleType | null> {
        try {
            return await this.prisma.vehicleType.update({
                where: {
                    uid: uid
                },
                data : {
                    name: name,
                    description: description
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

   /**
     * Removes a vehicle type in the database.
     *
     * @param uid - Indicator which vehicle type should be removed.
     * @returns True | False depending on if the track was removed or not.
     */
    public async removeType(uid:number) : Promise<boolean> {
        try {
            await this.prisma.vehicleType.delete({
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
     * Returns a list of all vehicle types.
     *
     * @returns VehicleType[] - List of all vehicle types.
     */
    public async getAllTypes() : Promise<VehicleType[]> {
        try {
            return await this.prisma.vehicleType.findMany({})
        } catch (e) {
            logger.debug(e)
            return []
        }
    }

    /**
     * Looks up a vehicle type given by its uid.
     *
     * @param uid - Indicator which vehicle type should be searched for.
     * @returns VehicleType | null depending on if the vehicle type could be found.
     */
    public async getTypeById(uid: number) : Promise<VehicleType | null> {
        try {
            return await this.prisma.vehicleType.findUnique({
                where: {
                    uid: uid
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Looks up a vehicle type by its name.
     *
     * @param uid - Indicator which vehicle type should be searched for.
     * @returns VehicleType | null depending on if the vehicle type could be found.
     */
    public async getTypeByName(name: string) : Promise<VehicleType | null> {
        try {
            return await this.prisma.vehicleType.findUnique({
                where: {
                    name: name
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    // ========================================================= //
    // [Vehicles]

    /**
     * Saves a new vehicle in the database.
     *
     * @param typeId - VehicleType uid
     * @param trackerId - Tracker uid
     * @param name - display name for the given vehicle (Optional)
     * @returns Vehicle | null if an error occurs.
     */
    public async save(typeId : number, trackerId : string, name?: string) : Promise<Vehicle | null> {
        try {
            return await this.prisma.vehicle.create({
                data : {
                    name: name,
                    typeId: typeId,
                    trackerId: trackerId
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Updadtes a vehicle in the database.
     *
     * @param uid - Indicator which vehicle should be updated
     * @param typeId - New VehicleType.uid after change (Optional)
     * @param trackerId - New Tracker.uid after change (Optional)
     * @param name - New display name after change (Optional)
     * @returns Vehicle | null if an error occurs
     */
    public async update(uid: number, typeId? : number, trackerId? : string, name?: string) : Promise<Vehicle | null> {
        try {
            return await this.prisma.vehicle.update({
                where : {
                    uid: uid
                },
                data: {
                    name: name,
                    typeId: typeId,
                    trackerId: trackerId
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Removes a vehicle in the database.
     *
     * @param uid - Indicator which vehicle should be removed.
     * @returns True | False depending on if the vehicle was removed or not.
     */
    public async remove(uid: number) : Promise<boolean> {
        try {
            await this.prisma.vehicle.delete({
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
     * Returns a list of all vehicles.
     *
     * @returns Vehicle[]
     */
    public async getAll() : Promise<Vehicle[]> {
        try {
            return await this.prisma.vehicle.findMany({
                include : {
                    type: true
                }
            })
        } catch (e) {
            logger.debug(e)
            return []
        }
    }

    /**
     * Looks up a vehicle by its uid.
     *
     * @param uid - Indicator which vehicle should be looked for.
     * @returns Vehicle | null depending on if the vehicle could be found.
     */
    public async getById(uid: number) : Promise<Vehicle | null> {
        try {
            return await this.prisma.vehicle.findUnique({
                where: {
                    uid: uid
                },
                include: {
                    type: true
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Looks up a vehicle by its name.
     *
     * @param name - Indicator which vehicle should be looked for.
     * @returns Vehicle | null depending on if the vehicle could be found.
     */
    public async getByName(name: string) : Promise<Vehicle | null> {
        try {
            return await this.prisma.vehicle.findUnique({
                where: {
                    name: name
                },
                include: {
                    type: true
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Looks up the newest log of a connected vehicle and returns it's position.
     *
     * @param uid - Indicator of the vehicle.
     * @returns JSON of the log position | null if an error occurs.
     */
    public async getCurrentPosition(uid: number) : Promise<JSON | null> {
        try {
            let veh = await this.getById(uid)
            let trackerId = veh?.trackerId
            let logs = await this.prisma.log.findMany({
                where: {
                    trackerId: trackerId
                },
                orderBy : [
                    {
                        timestamp: 'desc'
                    }
                ]
            })
            return JSON.parse(JSON.stringify(logs[0].position))
        } catch (e) {
            logger.debug(e)
            return null
        }
    }
}