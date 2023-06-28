import { logger } from "../utils/logger"
import { Log, Tracker, Vehicle } from "@prisma/client"
import VehicleService from "./vehicle.service"
import database from "./database.service"

/**
 * Service for tracker management. This includes registration of new trackers and writing logs.
 */
export default class TrackerService{

    /**
     * Register new trackers
     * @param trackerId id of `Tracker`
     * @param data data from tracker when sending hello-message
     * @returns `Tracker` if registration was successful, `null` otherwise
     */
    public static async registerTracker(trackerId: string, data?: JSON): Promise<Tracker | null>{
        let tracker = await this.getTrackerById(trackerId);
        if(tracker == null) {
            database.trackers.save(trackerId, undefined, data);
        }
        return tracker;
    }

    /**
     * Search for tracker by id
     * @param id id of `Tracker`
     * @returns `Tracker` if it exists, `null` otherwise
     */
    public static async getTrackerById(id: string): Promise<Tracker | null>{
        return database.trackers.getById(id)
    }

    /**
     * Get all trackers for a given vehicle
     * @param vehicleId `Vehicle.uid`, the trackers are assigned to
     * @returns `Tracker`[] assigned to `vehicle`
     */
    public static async getTrackerByVehicle(vehicleId: number): Promise<Tracker[]>{
        return await database.trackers.getByVehicleId(vehicleId)
    }

    /**
     * Assign tracker to a vehicle
     * @param tracker `Tracker` to assign to a vehicle
     * @param vehicle `Vehicle`, which gets assigned a tracker
     * @returns `Vehicle` the tracker got assigned to if successful, `null` otherwise
     */
    public static async setVehicle(tracker: Tracker, vehicle: Vehicle): Promise<Vehicle | null>{
        return VehicleService.assignTrackerToVehicle(vehicle, tracker)
    }

    /**
     * Deletes a tracker
     * @param tracker `Tracker` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removeTracker(tracker: Tracker): Promise<boolean>{
        return database.trackers.remove(tracker.uid)
    }



    // --- Tracker logs ---

    /**
     * TODO: Define internal schema for data? Where?
     * Log new data received by a tracker
     * @param trackerId id of the `Tracker´
     * @param timestamp creation timestamp of the log
     * @param position current position
     * @param heading heading of the tracker in degree
     * @param speed speed of the tracker in kmph
     * @param battery battery voltage of the tracker in V
     * @param data data received by a tracker
     * @returns a new entry `Log` if successful, `null` otherwise
     */
    public static async appendLog(trackerId: string, timestamp: Date, position: JSON, heading: number, speed: number, battery: number, data: JSON): Promise<Log | null>{
        logger.info('reached service');
        logger.info(data);

        if(await this.getTrackerById(trackerId) == null) {
            this.registerTracker(trackerId);
        }

        return database.logs.save(timestamp, trackerId, position, heading, speed, battery, data);
    }

    /**
     * Get log entries for a given tracker
     * @param tracker `Tracker` to search the log entries by
     * @returns `Log[]` of all log entries for `tracker` or `null` if `tracker` does not exist
     */
    public static async getTrackerLogs(tracker: Tracker): Promise<Log[] | null>{
        return database.logs.getAll(tracker.uid)
    }

    // TODO: remove old logs?

}