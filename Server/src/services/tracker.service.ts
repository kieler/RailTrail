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
     * @param tracker data from tracker when sending hello-message
     * @param vehicle optional `Vehicle` which  is assigned to the tracker
     * @param name optional name for created tracker
     * @returns `Tracker` if registration was successful, `null` otherwise
     */
    public static async registerTracker(tracker: JSON, vehicle?: Vehicle, name?: string): Promise<Tracker | null>{
        // TODO: what do we get? Either use tracker model here or JSON
        // TODO: implement
        return null
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
     * @param vehicle `Vehicle`, the trackers are assigned to
     * @returns `Tracker` assigned to `vehicle` or `null` if `vehicle` does not exist
     */
    public static async getTrackerByVehicle(vehicle: Vehicle): Promise<Tracker | null>{
        return database.trackers.getById(vehicle.trackerId)
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
     * Log new data received by a tracker
     * @param trackerLog data received by a tracker
     * @returns a new entry `Log` if successful, `null` otherwise
     */
    public static async appendLog(trackerLog: JSON): Promise<Log | null>{
        // TODO: what do we get? Either use tracker log model here or JSON
        // TODO: implement
        return null
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