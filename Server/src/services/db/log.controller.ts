import { Log, PrismaClient, Prisma } from "@prisma/client";
import { logger } from "../../utils/logger";

/**
 * LogController class
 *
 * Handles log specific access to the database.
 * @functions
 * Logs:
 *      - save()
 *      - update()
 *      - remove()
 *      - getAll()
 *      - getLog()
 */
export default class LogController {

    constructor(private prisma: PrismaClient) { }

    // ========================================================= //
    // [Tracker Logs]

    /**
     * Saves a new log in the database.
     *
     * @param timestamp - Time of log.
     * @param vehicleId - Vehicle.uid which is associated with this log.
     * @param position - Current GPS position at the time of the creation of the log.
     * @param heading - Current GPS heading at the time of the creation of the log.
     * @param speed - Current speed at the time of the creation of the log.
     * @param battery - Current battery charge at the time of the creation of the log. (Optional for the case of app data)
     * @param trackerId - Tracker.uid which caused the log. (Optional for the case of app data)
     * @param data - optional addtional data field.
     * @returns Log | null if an error occurs.
     */
    public async save(timestamp: Date, vehicleId: number, position: JSON, heading: number, speed: number, battery?: number, data?: JSON, trackerId?: string): Promise<Log | null> {
        try {
            // Note: Prisma converts JSON into JSONValues for more functionality.
            // Either JSON.parse(JSON.stringify(position)) as Prisma.InputJsonValue or position as unknown as Prisma.InputJsonValue is the solution.
            return await this.prisma.log.create({
                data: {
                    timestamp: timestamp,
                    trackerId: trackerId,
                    position: (position as unknown as Prisma.InputJsonValue),
                    heading: heading,
                    speed: speed,
                    battery: battery,
                    vehicleId: vehicleId,
                    data: (data as unknown as Prisma.InputJsonValue)
                }
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Updates a Log entry.
     * 
     * @param uid - Indicator for specific log.
     * @param timestamp - Time when the log was created.
     * @param position - gps position of the tracker/app.
     * @param heading - degree in which the tracker/app was pointing.
     * @param speed - current speed of tracker/app.
     * @param battery - current battery of tracker.
     * @param data - GPS Data.
     * @param vehicleId - which vehicle is connected with said tracker/app. For tracker this can be found in the tracker model.
     * @param trackerId - identifier for said tracker. For app data this field is always `null`
     * @returns Log | null if an error occurs.
     */
    public async update(uid: number, timestamp?: Date, position?: JSON, heading?: number, speed?: number, battery?: number, data?: JSON, vehicleId?: number, trackerId?: string): Promise<Log | null> {
        try {
            // Note: Prisma converts JSON into JSONValues for more functionality.
            // Either JSON.parse(JSON.stringify(position)) as Prisma.InputJsonValue or position as unknown as Prisma.InputJsonValue is the solution.
            return await this.prisma.log.update({
                where: {
                    uid: uid
                },
                data: {
                    timestamp: timestamp,
                    position: (position as unknown as Prisma.InputJsonValue),
                    heading: heading,
                    speed: speed,
                    battery: battery,
                    data: (data as unknown as Prisma.InputJsonValue),
                    vehicleId: vehicleId,
                    trackerId: trackerId
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
     * @param uid - Indicator which log should be removed
     * @returns True | False depending on if the log could be removed.
     */
    public async remove(uid: number): Promise<boolean> {
        try {
            await this.prisma.log.delete({
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
	 * Return a list of all logs. (Sorted: Descending by timestamp)
	 * If a trackerId is given the list will be filtered for this specific tracker.
	 * If a vehicleId is given the list will be filtered for this specific vehicle.
	 *
	 * @param limit - Number of entries this method should deliver. Default is all (undefined)
	 * @param vehicleId - Vehicle to filter for (Optional)
	 * @param trackerId - Tracker to filter for (Optional)
	 * @returns Log[] - List of all logs
	 */
	public async getAll(vehicleId?: number, trackerId?: string, limit?: number): Promise<Log[]> {
		return await this.prisma.log.findMany({
			where: {
				vehicleId: vehicleId,
				trackerId: trackerId
			},
			orderBy: [
				{
					timestamp: "desc"
				}
			],
			take: limit
		})
	}

    /**
     * Looks up a specific log in the database.
     *
     * @param uid - Indicator for log
     * 
     * @returns Log | null depending on if the log could be found.
     */
    public async getLog(uid: number): Promise<Log | null> {
        try {
            return await this.prisma.log.findUnique({
                where: {
                    uid: uid,
                },
                include: {
                    vehicle: true,
                    tracker: true
                },
            })
        } catch (e) {
            logger.debug(e)
            return null
        }
    }

    /**
     * Returns a list of the newest logs for an vehicle.
     * 
     * 
     * @param vehicleId - Indicator which vehicle's logs should be considered.
     * @param max_sec - How old the logs can be at max. Default: 5 min
     * 
     * @returns Log[] - list of logs for said vehicleId from now until max_sec ago.
     */
    public async getNewestLogs(vehicleId: number, max_sec: number = 300): Promise<Log[]> {
        let logs = await this.getAll(vehicleId = vehicleId)
        let max_date = Date.now() - (max_sec * 1000)

        // Because the logs are sorted by timestamps in descending order we just need to find 
        // the log with an timestamp older then our max_date and don't need to bother with the rest of it
        let i = 0
        while (new Date(logs[i].timestamp).getTime() >= max_date) {
            i += 1
        }
        return logs.slice(0, i + 1)
    }
}