import { Log, PrismaClient, Prisma, VehicleLog } from "@prisma/client"
import { logger } from "../../utils/logger"

/**
 * LogController class
 *
 * Handles log specific access to the database.
 * This means this controller handles (tracker) logs and vehicle logs.
 * @functions
 * Logs:
 *      - save()
 *      - update()
 *      - remove()
 *      - getAll()
 *      - getLog()
 *
 * VehicleLogs:
 *      - save()
 *      - update()
 *      - remove()
 *      - getVehicleLog()
 *      - getAllVehicleLog()
 *
 */
export default class LogController {
    constructor(private prisma: PrismaClient) {}

    // ========================================================= //
    // [Tracker Logs]

    /**
     * Saves a new log in the database.
     *
     * @param timestamp - Time of log.
     * @param trackerId - Tracker.uid which caused the log.
     * @param position - Current GPS position at the time of the creation of the log.
     * @param heading - Current GPS heading at the time of the creation of the log.
     * @param speed - Current speed at the time of the creation of the log.
     * @param battery - Current battery charge at the time of the creation of the log.
     * @param data - optional addtional data field.
     * @returns Log | null if an error occurs.
     */
    public async save(
        timestamp: Date,
        trackerId: string,
        position: JSON,
        heading: number,
        speed: number,
        battery: number,
        data?: JSON
    ): Promise<Log | null> {
        try {
            // TODO: vvv This.
            let pos = JSON.parse(
                JSON.stringify(position)
            ) as Prisma.InputJsonObject
            let d = (
                data === undefined
                    ? Prisma.JsonNull
                    : JSON.parse(JSON.stringify(data))
            ) as Prisma.InputJsonObject
            return await this.prisma.log.create({
                data: {
                    timestamp: timestamp,
                    trackerId: trackerId,
                    position: pos,
                    heading: heading,
                    speed: speed,
                    battery: battery,
                    data: d
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Updates a log in the database
     *
     * @param timestamp - Time of log which should be updated. (Key Pair with trackerId)
     * @param trackerId - Tracker.uid of Log which should be updated. (Key Pair with timestamp)
     * @param position - New position after change (optional)
     * @param heading - New heading after change (optional)
     * @param speed - New speed after change (optional)
     * @param battery - New battery after change (optional)
     * @param data - new optional addtional data field.
     * @returns Log | null if an error occurs.
     */
    public async update(
        timestamp: Date,
        trackerId: string,
        position?: JSON,
        heading?: number,
        speed?: number,
        battery?: number,
        data?: JSON
    ): Promise<Log | null> {
        try {
            // TODO: vvv This.
            let pos = JSON.parse(
                JSON.stringify(position)
            ) as Prisma.InputJsonObject
            let d = (
                data === undefined
                    ? Prisma.JsonNull
                    : JSON.parse(JSON.stringify(data))
            ) as Prisma.InputJsonObject
            return await this.prisma.log.update({
                where: {
                    timestamp_trackerId: {
                        timestamp: timestamp,
                        trackerId: trackerId
                    }
                },
                data: {
                    position: pos,
                    heading: heading,
                    speed: speed,
                    battery: battery,
                    data: d
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
     * @param timestamp - Time of log. (Key Pair with trackerId)
     * @param trackerId - Tracker.uid of Log. (Key Pair with timestamp)
     * @returns True | False depending on if the log could be removed.
     */
    public async remove(timestamp: Date, trackerId: string): Promise<boolean> {
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
    public async getAll(trackerId?: string): Promise<Log[]> {
        try {
            return await this.prisma.log.findMany({
                where: {
                    trackerId: trackerId
                },
                orderBy: [
                    {
                        timestamp: "desc"
                    }
                ]
            })
        } catch (e) {
            logger.debug(e)
            return []
        }
    }

    /**
     * Looks up a specific log in the database.
     *
     * @param timestamp - Time of log which should be updated. (Key Pair with trackerId)
     * @param trackerId - Tracker.uid of Log which should be updated. (Key Pair with timestamp)
     * @returns Log | null depending on if the log could be found.
     */
    public async getLog(
        timestamp: Date,
        trackerId: string
    ): Promise<Log | null> {
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

    // ========================================================= //
    // [Vehicle Logs]

    /**
     * Saves a vehicle log.
     *
     * @param timestamp - Time of log.
     * @param vehicleId - Vehicle.uid which is assigned to this log.
     * @param position - Current GPS position at the time of the creation of the log.
     * @param heading - Current GPS heading at the time of the creation of the log.
     * @param speed - Current speed at the time of the creation of the log.
     * @param data - logs which were used to determine the above data. This means it references the tracker logs and possible user data from said app.
     * @returns VehicleLog | null if an error occurs.
     */
    public async saveVehicleLog(
        timestamp: Date,
        vehicleId: number,
        position: JSON,
        heading: number,
        speed: number,
        data: JSON
    ): Promise<VehicleLog | null> {
        try {
            // TODO: vvv This.
            let pos = JSON.parse(
                JSON.stringify(position)
            ) as Prisma.InputJsonObject
            let d = (
                data === undefined
                    ? Prisma.JsonNull
                    : JSON.parse(JSON.stringify(data))
            ) as Prisma.InputJsonObject
            return await this.prisma.vehicleLog.create({
                data: {
                    timestamp: timestamp,
                    vehicleId: vehicleId,
                    position: pos,
                    heading: heading,
                    speed: speed,
                    data: d
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Updates a vehicle log in the database
     *
     * @param timestamp - Time of log which should be updated. (Key Pair with vehicleId)
     * @param vehicleId - Vehicle.uid of Log which should be updated. (Key Pair with timestamp)
     * @param position - New position after change (optional)
     * @param heading - New heading after change (optional)
     * @param speed - New speed after change (optional)
     * @param data - new addtional data field. (optional)
     * @returns VehicleLog | null if an error occurs.
     */
    public async updateVehicleLog(
        timestamp: Date,
        vehicleId: number,
        position?: JSON,
        heading?: number,
        speed?: number,
        data?: JSON
    ): Promise<VehicleLog | null> {
        try {
            let pos = JSON.parse(
                JSON.stringify(position)
            ) as Prisma.InputJsonObject
            let d = (
                data === undefined
                    ? Prisma.JsonNull
                    : JSON.parse(JSON.stringify(data))
            ) as Prisma.InputJsonObject
            return await this.prisma.vehicleLog.update({
                where: {
                    timestamp_vehicleId: {
                        timestamp: timestamp,
                        vehicleId: vehicleId
                    }
                },
                data: {
                    position: pos,
                    heading: heading,
                    speed: speed,
                    data: d
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Removes a vehicle log from the database.
     *
     * @param timestamp - Time of log. (Key Pair with vehicleId)
     * @param vehicleId - Vehicle.uid of Log. (Key Pair with timestamp)
     * @returns True | False depending on if the log could be removed.
     */
    public async removeVehicleLog(
        timestamp: Date,
        vehicleId: number
    ): Promise<Boolean> {
        try {
            await this.prisma.vehicleLog.delete({
                where: {
                    timestamp_vehicleId: {
                        timestamp: timestamp,
                        vehicleId: vehicleId
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
     * Looks up a specific vehicle log.
     *
     * @param timestamp - Time of log. (Key Pair with vehicleId)
     * @param vehicleId - Vehicle.uid of Log. (Key Pair with timestamp)
     * @returns VehicleLog | null if an error occurs.
     */
    public async getVehicleLog(
        timestamp: Date,
        vehicleId: number
    ): Promise<VehicleLog | null> {
        try {
            return await this.prisma.vehicleLog.findUnique({
                where: {
                    timestamp_vehicleId: {
                        timestamp: timestamp,
                        vehicleId: vehicleId
                    }
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Looks up a list of vehicle logs for a specific vehicle.
     *
     * @param vehicleId - Vehicle.uid of log.
     * @returns List of all vehicle logs specific for this vehicle.
     */
    public async getAllVehicleLog(vehicleId: number): Promise<VehicleLog[]> {
        try {
            return await this.prisma.vehicleLog.findMany({
                where: {
                    vehicleId: vehicleId
                }
            })
        } catch (e) {
            logger.debug(e)
            return []
        }
    }
}
