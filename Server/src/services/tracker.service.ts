import { Log, Prisma, Vehicle } from "@prisma/client"
import database from "./database.service"

/**
 * Service for tracker management. This includes registration of new trackers and writing logs.
 */
export default class TrackerService {
	// --- Vehicle logs ---

	/**
	 * Log new data received by a tracker or app instances associated with a vehicle
	 * @param vehicle id of the `Vehicle`
	 * @param timestamp creation timestamp of the log
	 * @param position current position
	 * @param heading heading of the vehicle in degree (0-359)
	 * @param speed speed of the vehicle in kmph
	 * @param trackerId (optional) id of the `Tracker´
	 * @param battery (optional) battery voltage of the tracker in V
	 * @param data (optional) data received by a tracker
	 * @returns a new entry `Log` if successful
	 * @throws PrismaError if the new log could not be saved
	 */
	public static async appendLog(
		vehicle: Vehicle,
		timestamp: Date,
		position: [number, number],
		heading: number,
		speed: number,
		trackerId?: string,
		battery?: number,
		data?: unknown
	): Promise<Log> {
		// if no tracker id is given, the fields for battery and other data should be ignored
		// TODO: Is this the right way? Maybe needs a fix when merging related PR for refining DB
		if (trackerId == null) {
			return database.logs.save({ timestamp, vehicleId: vehicle.uid, position, heading, speed })
		}

		return database.logs.save({
			timestamp,
			vehicleId: vehicle.uid,
			position,
			heading,
			speed,
			battery,
			data: data as Prisma.InputJsonValue,
			trackerId
		})
	}
}
