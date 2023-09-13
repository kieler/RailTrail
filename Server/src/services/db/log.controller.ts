import { Log, PrismaClient, Prisma } from "@prisma/client"

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
	constructor(private prisma: PrismaClient) {}

	// ========================================================= //
	// [Tracker Logs]

	/**
	 * Saves a new log in the database.
	 *
	 * The parameter are given via object deconstruction from the model `Log`!
	 * Currently given parameters are:
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
	public async save(args: Prisma.LogUncheckedCreateInput): Promise<Log> {
		//LogUncheckCreateInput is used because of required relations with other models!
		return await this.prisma.log.create({
			data: args
		})
	}

	/**
	 * Updates a Log entry.
	 *
	 * @param uid - Indicator for specific log.
	 *
	 * The parameter are given via object deconstruction from the model `Log`!
	 * Currently given parameters are:
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
	public async update(uid: number, args: Prisma.LogUpdateInput): Promise<Log | null> {
		return await this.prisma.log.update({
			where: {
				uid: uid
			},
			data: args
		})
	}

	/**
	 * Removes a log from the database.
	 *
	 * @param uid - Indicator which log should be removed
	 * @returns True if the removal was successful. Otherwise throws an Error.
	 */
	public async remove(uid: number): Promise<boolean> {
		await this.prisma.log.delete({
			where: {
				uid: uid
			}
		})
		return true
	}

	/**
	 * Return a list of all logs. (Sorted: Descending by timestamp)
	 * If a trackerId is given the list will be filtered for this specific tracker.
	 * If a vehicleId is given the list will be filtered for this specific vehicle.
	 * 
	 * Note: If limit is set to 1 , `getLatestLog` should be considered instead.
	 *
	 * @param limit - Number of entries this method should deliver. Default is all (undefined).
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
		return await this.prisma.log.findUnique({
			where: {
				uid: uid
			},
			include: {
				vehicle: true,
				tracker: true
			}
		})
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
		// Earliest date which should be considered
		const max_date = new Date(Date.now() - max_sec * 1000)

		return await this.prisma.log.findMany({
			where: {
				vehicleId: vehicleId,
				timestamp: {
					gt: max_date
				}
			},
			orderBy: [
				{
					timestamp: "desc"
				}
			]
		})
	}

	/**
	 * Returns the latest recorded log.
	 * 
	 * @param vehicleId - Indicator which vehicle should be considered (Optional)
	 * @param trackerId - Indicator which tracker should be considered (Optional)
	 * @returns Log
	 */
	public async getLatestLog(vehicleId?: number, trackerId?: string): Promise<Log | null> {
		return await this.prisma.log.findFirst({
			where: {
				vehicleId: vehicleId,
				trackerId: trackerId
			},
			orderBy: [
				{
					timestamp: "desc"
				}
			]
		})
	}
}
