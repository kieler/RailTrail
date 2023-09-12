import { PrismaClient, Prisma, Vehicle, VehicleType } from "@prisma/client"

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
	 * The parameter are given via object deconstruction from the model `VehicleType`!
	 * Currently given parameters are:
	 * @param name - **unique** Name for the type of vehicle.
	 * @param icon - unique icon name for visualization
	 * @param description - optional description for the type.
	 * @returns VehicleType | null if an error occurs
	 */
	public async saveType(args: Prisma.VehicleTypeCreateInput): Promise<VehicleType> {
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
	public async updateType(uid: number, args: Prisma.VehicleTypeUpdateInput): Promise<VehicleType> {
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
	 * @returns True if the removal was successful. Otherwise throws an Error.
	 */
	public async removeType(uid: number): Promise<boolean> {
		await this.prisma.vehicleType.delete({
			where: {
				uid: uid
			}
		})
		return true
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
	 * @returns Vehicle
	 */
	public async save(args: Prisma.VehicleUncheckedCreateInput): Promise<Vehicle> {
		// VehicleUncheckedCreateInput is used because of required relations

		// Due to soft-deletion we need to check if a vehicle with said name alread exists in the active state
		if (args.inactive == false) {
			let veh = await this.getByName(args.name, args.trackId)
			if (veh == null) {
				// Vehicle doesn't exists in active state
				return await this.prisma.vehicle.create({
					data: args
				})
			} else {
				// Vehicle already exists in active state
				// Prismas inhouse error for 'unique constraint failed'
				throw new Prisma.PrismaClientKnownRequestError("Vehicle already exists in active state.", {
					code: "P2002",
					clientVersion: ""
				})
			}
		} else {
			// Operation tried to save an already dead vehicle
			// Prismas inhouse error for 'query interpretation error'
			throw new Prisma.PrismaClientKnownRequestError("Tried to create an inactive vehicle.", {
				code: "P2016",
				clientVersion: ""
			})
		}
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
	 * @returns Vehicle
	 */
	public async update(uid: number, args: Prisma.VehicleUncheckedUpdateInput): Promise<Vehicle | null> {
		// VehicleUncheckCreateInput is used because of required relations
		if (args.inactive == false) {
			// Operation tried to resurrect vehicle
			throw new Prisma.PrismaClientKnownRequestError("Vehicle already exists in active state.", {
				code: "P2002",
				clientVersion: ""
			})
		}
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
	 * Note: Doesn't delete the data of the vehicle but soft-deletes it, resulting in an inactive vehicle!
	 *
	 * @param uid - Indicator which vehicle should be removed.
	 * @returns True if the removal was successful. Otherwise throws an Error.
	 */
	public async remove(uid: number): Promise<boolean> {
		// Remove tracker ref to vehicle
		let veh = await this.prisma.tracker.updateMany({
			where: {
				vehicleId: uid
			},
			data: {
				vehicleId: null
			}
		})

		// Set vehicle status
		await this.update(uid, { inactive: true })
		return true
	}

	/**
	 * Returns a list of all vehicles.
	 *
	 * @param trackId - Track.uid for filtering list (Optional)
	 * @param inactive - Indicator of status of the vehicle (Default: False)
	 *
	 * Note: To get every Vehicle - regardless of active or inactive - set inactive to undefined!
	 *
	 * @returns Vehicle[]
	 */
	public async getAll(trackId?: number, inactive: boolean = false): Promise<Vehicle[]> {
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
	 * @param trackId - Track.uid which track should be searched for.
	 * @param inactive - Indicator if the vehicle was once deleted (Default: False).
	 * @returns Vehicle | null depending on if the vehicle could be found.
	 */
	public async getByName(name: string, trackId: number, inactive: boolean = false): Promise<Vehicle | null> {
		// Due to Soft-Deletion we can't convert name and trackId to a key anymore because we can have
		// Multiple inactive vehicles with the same name but only one active vehicle with this name on the track
		return await this.prisma.vehicle.findFirst({
			where: {
				name: name,
				trackId: trackId,
				inactive: inactive
			},
			include: {
				type: true,
				track: true
			}
		})
	}
}
