import { logger } from "../utils/logger"
// import { Vehicle } from "../models/vehicle"; // TODO: model
// import { VehicleType } from "../models/vehicle_type"; // TODO: model

/** Service for vehicle management. */
export default class VehicleService{
    
    /**
     * Create a new vehicle
     * @param type `VehicleType` of new vehicle
     * @param name optional name for new vehicle
     * @returns created `Vehicle` if successful, `null` otherwise
     */
    public static async createVehicle(type: null, name: string = ""): Promise<null>{
        // TODO: type needs model
        // TODO: implement
        return null
    }

    /**
     * Search vehicle by id
     * @param id id to search vehicle for
     * @returns `Vehicle` with id `id` if it exists, `null` otherwise
     */
    public static async getVehicleById(id: number): Promise<null>{
        // TODO: implement
        return null
    }

    /**
     * Search for nearby vehicles either within a certain distance or by amount and either from a given point or vehicle
     * @param point point to search nearby vehicles from, this could also be a vehicle
     * @param count amount of vehicles, that should be returned. If none given only one (i.e. the nearest) will be returned.
     * @param distance maximum distance in track-kilometers to the vehicles
     * @param type `VehicleType` to filter the returned vehicles by
     * @returns `[Vehicle]` either #`count` of nearest vehicles or all vehicles within `distance` of track-kilometers. That is the array could be empty
     */
    public static async getNearbyVehicles(point: GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties> | null | null = null, count: number = 1, distance: number = 0, type: null = null): Promise<null>{
        // TODO: type and point (Vehicle) need models
        // TODO: implement
        return null
    }

    /**
     * Search for vehicles on a track
     * @param track `Track` to search on for vehicles
     * @param type `VehicleType` to filter the returned vehicles by
     * @returns `[Vehicle]` of all vehicles on the given `track`
     */
    public static async getAllVehiclesForTrack(track: null, type: null = null): Promise<null>{
        // TODO: track and type need models
        // TODO: implement
        return null
    }
    
    /**
     * This is just a wrapper that gets the position of the tracker assigned to a given vehicle. Also it accumulates all
     * tracker data as a vehicle could have more than one tracker assigned.
     * @param vehicle `Vehicle` to get the position for
     * @returns last known position of `vehicle` based on tracker data (besides the GeoJSON point there is also the track 
     *          kilometer in the returned GeoJSON properties field), `null` if position is unknown
     */
    public static async getVehiclePosition(vehicle: null): Promise<GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties> | null>{
        // TODO: vehicle needs model
        // TODO: implement
        return null
    }

    /**
     * This is just a wrapper that gets the heading of the tracker assigned to a given vehicle. Also it accumulates all
     * tracker data as a vehicle could have more than one tracker assigned.
     * @param vehicle `Vehicle` to get the heading for
     * @returns last known heading (between 0 and 359) of `vehicle` based on tracker data, -1 if heading is unknown
     */
    public static async getVehicleHeading(vehicle: null): Promise<number>{
        // TODO: vehicle needs model
        // TODO: implement
        return -1
    }

    /**
     * This is just a wrapper that gets the speed of the tracker assigned to a given vehicle. Also it accumulates all
     * tracker data as a vehicle could have more than one tracker assigned.
     * @param vehicle `Vehicle` to get the speed for
     * @returns last known speed (always a positive number) of `vehicle` based on tracker data, -1 if position is unknown
     */
    public static async getVehicleSpeed(vehicle: null): Promise<number>{
        // TODO: vehicle needs model
        // TODO: implement
        return -1
    }

    /**
     * Updates position and track of a given vehicle
     * @param vehicle `Vehicle` to update
     * @returns updated `Vehicle` if successful, `null` otherwise
     */
    private static async updateVehicle(vehicle: null): Promise<null>{
        // TODO: vehicle needs model
        // TODO: implement
        return null
    }

    /**
     * Rename an existing vehicle
     * @param vehicle `Vehicle` to rename
     * @param newName new name for `vehicle`
     * @returns renamed `Vehicle` if successful, `null` otherwise
     */
    public static async renameVehicle(vehicle: null, newName: string): Promise<null>{
        // TODO: vehicle needs model
        // TODO: implement
        return null
    }

    /**
     * Update type of vehicle
     * @param vehicle `Vehicle` to set new type for
     * @param type new `VehicleType` of `vehicle`
     * @returns updated `Vehicle` if successful, `null` otherwise
     */
    public static async setVehicleType(vehicle: null, type: null): Promise<null>{
        // TODO: type and vehicle need models
        // TODO: implement
        return null
    }

    /**
     * Delete existing vehicle
     * @param vehicle `Vehicle` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removeVehicle(vehicle: null): Promise<boolean>{
        // TODO: vehicle needs model
        // TODO: implement
        return false
    }



    // --- vehicle types ---

    /**
     * Create a new vehicle type
     * @param type description of new vehicle type
     * @returns created `VehicleType` if successful, `null` otherwise
     */
    public static async createVehicleType(type: string): Promise<null>{
        // TODO: implement
        return null
    }

    /**
     * 
     * @returns all existing `VehicleType`s
     */
    public static async getAllVehicleTypes(): Promise<null>{
        // TODO: implement
        return null
    }

    /**
     * Change description of existing vehicle type
     * @param type `VehicleType` to change description of
     * @param newType new description for `type`
     * @returns updated `VehicleType` if successful, `null` otherwise
     */
    public static async renameVehicleType(type: null, newType: string): Promise<null>{
        // TODO: implement
        return null
    }

    /**
     * Delete existing vehicle type
     * @param type `VehicleType` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removeVehicleType(type: null): Promise<boolean>{
        // TODO: type needs model
        // TODO: implement
        return false
    }
}