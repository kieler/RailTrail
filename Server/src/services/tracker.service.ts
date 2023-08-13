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
        if (tracker == null) {
            return await database.trackers.save(trackerId, undefined, data);
        } else {
            return tracker;
        }
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
     * @returns `Tracker` that got assigned to a `Vehicle` if successful, `null` otherwise
     */
    public static async setVehicle(tracker: Tracker, vehicle: Vehicle): Promise<Tracker | null>{
        return database.trackers.update(tracker.uid, vehicle.uid)
    }

    /**
     * Deletes a tracker
     * @param tracker `Tracker` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removeTracker(tracker: Tracker): Promise<boolean>{
        return database.trackers.remove(tracker.uid)
    }



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
     * @returns a new entry `Log` if successful, `null` otherwise
     */
    public static async appendLog(vehicle: Vehicle, timestamp: Date, position: [number, number], heading: number, speed: number, trackerId?: string, battery?: number, data?: any): Promise<Log | null>{

        // if no tracker id is given, the fields for battery and other data should be ignored
        if (trackerId == null) {
            return database.logs.save(timestamp, vehicle.uid, position, heading, speed)
        }
        
        return database.logs.save(timestamp, vehicle.uid, position, heading, speed, battery, data, trackerId);
    }

    /**
     * TODO: Define internal schema for data? Where?
     * Log new data received by a tracker (wrapper to call from tracker endpoints, 
     * because they cannot "know" what vehicle they are on)
     * @param trackerId id of the `Tracker´
     * @param timestamp creation timestamp of the log
     * @param position current position
     * @param heading heading of the vehicle in degree (0-359)
     * @param speed speed of the vehicle in kmph
     * @param battery battery voltage of the tracker in V
     * @param data data received by a tracker
     * @returns a new entry `Log` if successful, `null` otherwise
     */
    public static async appendTrackerLog(trackerId: string, timestamp: Date, position: [number, number], heading: number, speed: number, battery: number, data: any): Promise<Log | null>{
        logger.info('reached service');
        logger.info(data);
        

        // check if tracker already exists and if not create it
        let tracker = await this.getTrackerById(trackerId)
        if(tracker == null) {
            tracker = await this.registerTracker(trackerId);
        }
        
        if (tracker == null || tracker.vehicleId == null) {
            // TODO: log this, especially if tracker is still null
            // (no vehicle id is not that critical as a tracker could exist without an assigned vehicle,
            // but logging will not happen then and would not make sense)
            return null
        }

        const vehicle = await VehicleService.getVehicleById(tracker.vehicleId)
        if (vehicle == null) {
            // TODO: log this, a vehicle should exist if a tracker is assigned to it
            return null
        }
        // actual wrapper
        return this.appendLog(vehicle, timestamp, position, heading, speed, trackerId, battery, data)
    }

    /**
     * Get log entries for a given vehicle
     * @param vehicle `Vehicle` to search the log entries by
     * @param tracker (optional) `Tracker` to filter logs
     * @returns `Log[]` of all log entries for `vehicle` or `null` if an error occured
     */
    public static async getVehicleLogs(vehicle: Vehicle, tracker?: Tracker): Promise<Log[] | null>{
        return database.logs.getAll(vehicle.uid, tracker?.uid)
    }

    // TODO: remove old logs?

}