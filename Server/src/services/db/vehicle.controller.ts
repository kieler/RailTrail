import { PrismaClient, Prisma } from "@prisma/client";
import type { Vehicle, VehicleType } from '@prisma/client';

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

    constructor(private prisma: PrismaClient) { }

    // ========================================================= //
    // [Vehicle Types]

    /**
     * Saves a vehicle type in the database.
     *
     * The parameter are given via object deconstruction from the model `VehicleType`!
     * Currently given parameters are:
     * @param name - **unique** Name for the type of vehicle.
     * @param icon - unique icon name for visualization
     * @param description - optional description for the type.
     * @returns VehicleType | null if an error occurs
     */
    public async saveType(args : Prisma.VehicleTypeCreateInput): Promise<VehicleType> {
        return await this.prisma.vehicleType.create({
            data: args
        })
    }

    /**
     * Updates a vehicle type in the database.
     *
     * @param uid - Indicator which vehicle type should be updated.
     *
     * The parameter are given via object deconstruction from the model `VehicleType`!
     * Currently given parameters are:
     * @param name - New name of the vehicle type after change. (Optional)
     * @param description - New description of the vehicle type after change. (Optional)
     * @returns
     */
    public async updateType(uid: number , args : Prisma.VehicleTypeUpdateInput): Promise<VehicleType> {
        return await this.prisma.vehicleType.update({
            where: {
                uid: uid
            },
            data: args
        })
    }

    /**
      * Removes a vehicle type in the database.
      *
      * @param uid - Indicator which vehicle type should be removed.
      * @returns True | False depending on if the track was removed or not.
      */
    public async removeType(uid: number): Promise<void> {
        await this.prisma.vehicleType.delete({
            where: {
                uid: uid
            }
        })
    }

    /**
     * Returns a list of all vehicle types.
     *
     * @returns VehicleType[] - List of all vehicle types.
     */
    public async getAllTypes(): Promise<VehicleType[]> {
        return await this.prisma.vehicleType.findMany({})
    }

    /**
     * Looks up a vehicle type given by its uid.
     *
     * @param uid - Indicator which vehicle type should be searched for.
     * @returns VehicleType | null depending on if the vehicle type could be found.
     */
    public async getTypeById(uid: number): Promise<VehicleType | null> {
        return await this.prisma.vehicleType.findUnique({
            where: {
                uid: uid
            }
        })
    }

    /**
     * Looks up a vehicle type by its name.
     *
     * @param uid - Indicator which vehicle type should be searched for.
     * @returns VehicleType | null depending on if the vehicle type could be found.
     */
    public async getTypeByName(name: string): Promise<VehicleType | null> {
        return await this.prisma.vehicleType.findUnique({
            where: {
                name: name
            }
        })
    }

    // ========================================================= //
    // [Vehicles]

    /**
     * Saves a new vehicle in the database.
     *
     * The parameter are given via object deconstruction from the model `Vehicle`!
     * Currently given parameters are:
     * @param typeId - VehicleType uid
     * @param trackId - Track uid
     * @param name - display name for the given vehicle (Optional)
     * @returns Vehicle | null if an error occurs.
     */
    public async save(args: Prisma.VehicleUncheckedCreateInput): Promise<Vehicle> {
        // VehicleUncheckedCreateInput is used because of required relations
        return await this.prisma.vehicle.create({
            data: args
        })
    }

    /**
     * Updadtes a vehicle in the database.
     *
     * @param uid - Indicator which vehicle should be updated
     *
     * The parameter are given via object deconstruction from the model `Vehicle`!
     * Currently given parameters are:
     * @param typeId - New VehicleType.uid after change (Optional)
     * @param trackId - New Track.uid after change (Optional)
     * @param name - New display name after change (Optional)
     * @returns Vehicle | null if an error occurs
     */
    public async update(uid: number, args: Prisma.VehicleUncheckedUpdateInput): Promise<Vehicle | null> {
        // VehicleUncheckCreateInput is used because of required relations
        return await this.prisma.vehicle.update({
            where: {
                uid: uid
            },
            data: args
        })
    }

    /**
     * Removes a vehicle in the database.
     *
     * @param uid - Indicator which vehicle should be removed.
     */
    public async remove(uid: number): Promise<void> {
        await this.prisma.vehicle.delete({
            where: {
                uid: uid
            }
        })
    }

    /**
     * Returns a list of all vehicles.
     *
     * @param trackId - Track.uid for filtering list (Optional)
     *
     * @returns Vehicle[]
     */
    public async getAll(trackId?: number): Promise<Vehicle[]> {
        return await this.prisma.vehicle.findMany({
            where: {
                trackId: trackId
            },
            include: {
                type: true,
                track: true
            }
        })
    }

    /**
     * Looks up a vehicle by its uid.
     *
     * @param uid - Indicator which vehicle should be looked for.
     * @returns Vehicle | null depending on if the vehicle could be found.
     */
    public async getById(uid: number): Promise<Vehicle | null> {
        return await this.prisma.vehicle.findUnique({
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
     * Looks up a vehicle by its name.
     *
     * @param name - Indicator which vehicle should be looked for.
     * @returns Vehicle | null depending on if the vehicle could be found.
     */
    public async getByName(name: string, trackId: number): Promise<Vehicle | null> {
        return await this.prisma.vehicle.findUnique({
            where: {
                name_trackId: {
                    name: name,
                    trackId: trackId
                }
            },
            include: {
                type: true,
                track: true
            }
        })
    }
}