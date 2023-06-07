import { logger } from "../utils/logger"
// import { Tracker } from "../models"; // TODO: model
// import { TrackerLog } from "../models"; // TODO: model
// import { Vehicle } from "../models"; // TODO: model

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
    public static async registerTracker(tracker: JSON | null, vehicle: null = null, name: string = ""): Promise<null>{
        // TODO: what do we get? Either use tracker model here or JSON
        // TODO: vehicle needs model
        // TODO: implement
        return null
    }

    /**
     * Search for tracker by id
     * @param id id of `Tracker`
     * @returns `Tracker` if it exists, `null` otherwise
     */
    public static async getTrackerById(id: number): Promise<null>{
        // TODO: implement
        return null
    }

    /**
     * Get all trackers for a given vehicle
     * @param vehicle `Vehicle`, the trackers are assigned to
     * @returns `[Tracker]` of trackers assigned to `vehicle` or `null` if `vehicle` does not exist
     */
    public static async getTrackerByVehicle(vehicle: null): Promise<null>{
        // TODO: vehicle needs model Vehicle
        // TODO: implement
        return null
    }

    /**
     * Assign tracker to a vehicle
     * @param tracker `Tracker` to assign to a vehicle
     * @param vehicle `Vehicle`, which gets assigned a tracker
     * @returns `Tracker` if successful, `null` otherwise
     */
    public static async setVehicle(tracker: null, vehicle: null): Promise<null>{
        // TODO: tracker needs model Tracker
        // TODO: vehicle needs model Vehicle
        // TODO: implement
        return null
    }
    
    /**
     * Deletes a tracker
     * @param tracker `Tracker` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removeTracker(tracker: null): Promise<boolean>{
        // TODO: tracker needs model Tracker
        // TODO: implement
        return false
    }



    // --- Tracker logs ---

    /**
     * Log new data received by a tracker
     * @param trackerLog data received by a tracker
     * @returns a new entry `TrackerLog` if successful, `null` otherwise
     */
    public static async appendLog(trackerLog: JSON | null): Promise<null>{
        // TODO: what do we get? Either use tracker log model here or JSON
        // TODO: implement
        return null
    }

    /**
     * Get log entries for a given tracker
     * @param tracker `Tracker` to search the log entries by
     * @returns `[TrackerLog]` of all log entries for `tracker` or `null` if `tracker` does not exist
     */
    public static async getTrackerLogs(tracker: null): Promise<null>{
        // TODO: tracker needs model Tracker
        // TODO: implement
        return null
    }

    // TODO: remove old logs?

}