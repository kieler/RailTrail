import { Prisma, PrismaClient, Tracker } from "@prisma/client";

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
   * The parameter are given via object deconstruction from the model `Tracker`!
   * Currently given parameters are:
   * @param uid - ID (EUI) of the tracker.
   * @param vehicleId - assign a vehicle for the tracker. Multiple tracker can have the same vehicle.
   * @param data - optional additional data field.
   * @returns Tracker
   */
  public async save(args: Prisma.TrackerCreateInput): Promise<Tracker> {
    return await this.prisma.tracker.create({
      data: args,
    });
  }

  /**
   * Updates a tracker in the database.
   *
   * @param uid - Indicator which tracker should be updated
   *
   * The parameter are given via object deconstruction from the model `Tracker`!
   * Currently given parameters are:
   * @param vehicleId - New vehicleId (Optional)
   * @param data - New additional data field (Optional)
   * @returns Tracker
   */
  public async update(
    uid: string,
    args: Prisma.TrackerUncheckedUpdateInput
  ): Promise<Tracker> {
    //TrackerUncheckedUpdateInput is used
    return await this.prisma.tracker.update({
      where: {
        uid: uid,
      },
      data: args,
    });
  }

  /**
   * Removes a tracker from the database.
   *
   * @param uid - Indicator which tracker should be removed.
   * @returns True if the removal was successful. Otherwise throws an Error.
   */
  public async remove(uid: string): Promise<boolean> {
    await this.prisma.tracker.delete({
      where: {
        uid: uid,
      },
    });
    return true
  }

  /**
   * Returns a list of all trackers
   *
   * @returns Tracker[] - List of all trackers.
   */
  public async getAll(): Promise<Tracker[]> {
    return await this.prisma.tracker.findMany({});
  }

  /**
   * Looks up a tracker given by its uid.
   *
   * @param uid - Indicator which tracker should be looked up.
   * @returns Tracker | null depending on if the tracker could be found.
   */
  public async getById(uid: string): Promise<Tracker | null> {
    return await this.prisma.tracker.findUnique({
      where: {
        uid: uid,
      },
    });
  }

  /**
   * Looks up all trackers for a given vehicle.
   *
   * @param vehicleId - uid of the vehicle.
   * @returns List of trackers assigned to the vehicle.
   */
  public async getByVehicleId(vehicleId: number): Promise<Tracker[]> {
    return await this.prisma.tracker.findMany({
      where: {
        vehicleId: vehicleId,
      },
    });
  }
}
