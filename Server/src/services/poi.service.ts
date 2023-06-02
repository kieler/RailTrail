import { logger } from "../utils/logger"
// import { POI } from "../models"; // TODO: model
// import { POIType } from "../models"; // TODO: model
// import { Track } from "../models"; // TODO: model

/**
 * Service for POI (point of interest) management.
 */
export default class POIService{

    /**
     * Create a new POI
     * @param position position of new POI
     * @param name name of new POI 
     * @param type `POIType` of new POI
     * @param track `Track` the new POI belongs to
     * @returns created `POI` if successful, `null` otherwise
     */
    public static async createPOI(position: GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties>, name: string, type: null, track: null = null): Promise<null>{
        // TODO: type and track need models
        // TODO: implement
        return null
    }

    /**
     * 
     * @param id id of POI to search for
     * @returns `POI` with `id` if it exists, `null` otherwise
     */
    public static async getPOIById(id: number): Promise<null>{
        // TODO: implement
        return null
    }

    /**
     * Search for nearby POI's either within a certain distance or by amount
     * @param point point to search nearby POI's from
     * @param count amount of points, that should be returned. If none given only one (i.e. the nearest) will be returned.
     * @param distance maximum distance in track-kilometers to the POI's
     * @param type `POIType` to filter the returned POI's by
     * @returns `[POI]` either #`count` of nearest POI's or all POI's within `distance` of track-kilometers. That is the array could be empty
     */
    public static async getNearbyPOIs(point: GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties>, count: number = 1, distance: number = 0, type: null = null): Promise<null>{
        // TODO: type needs model
        // TODO: implement
        return null
    }

    /**
     * Search for POI's on a track
     * @param track `Track` to search on for POI's
     * @param type `POIType` to filter the returned POI's by
     * @returns `[POI]` of all POI's along the given `track`
     */
    public static async getAllPOIsForTrack(track: null, type: null = null): Promise<null>{
        // TODO: track and type need models
        // TODO: implement
        return null
    }

    /**
     * Set a new position for an existing POI
     * @param poi `POI` to update 
     * @param position new position of `poi`
     * @returns updated `POI` if successful, `null` otherwise
     */
    public static async setPOIPosition(poi: null, position: GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties>): Promise<null>{
        // TODO: poi needs model
        // TODO: implement
        return null
    }

    /**
     * Rename an existing POI
     * @param poi `POI` to rename
     * @param newName new name of `poi`
     * @returns renamed `POI` if successful, `null` otherwise
     */
    public static async renamePOI(poi: null, newName: string): Promise<null>{
        // TODO: poi needs model
        // TODO: implement
        return null
    }

    /**
     * Set new type of POI
     * @param poi `POI` to update
     * @param type new type of `poi`
     * @returns updated `POI` if successful, `null` otherwise
     */
    public static async setPOIType(poi: null, type: null): Promise<null>{
        // TODO: poi and type need models
        // TODO: implement
        return null
    }

    /**
     * Delete existing POI
     * @param poi `POI` to delete
     * @returns `true`, if deletion was successful, `false` otherwise
     */
    public static async removePOI(poi: null): Promise<boolean>{
        // TODO: poi needs model
        // TODO: implement
        return false
    }



    // --- POI-types ---

    /**
     * Create new POI-type
     * @param type description of new POI-type
     * @returns created `POIType` if successful, `null` otherwise
     */
    public static async createPOIType(type: string): Promise<null>{
        // TODO: type needs model
        // TODO: implement
        return null
    }

    /**
     * 
     * @returns all existing `POIType`s
     */
    public static async getAllPOITypes(): Promise<null>{
        // TODO: implement
        return null
    }

    /**
     * Change description of existing POI-type
     * @param type `POIType` to change description of
     * @param newType new description for `type`
     * @returns renamed `POIType` if successful, `null` otherwise
     */
    public static async renamePOIType(type: null, newType: string): Promise<null>{
        // TODO: type needs model
        // TODO: implement
        return null
    }

    /**
     * Delete existing POI-type
     * @param type `POIType` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removePOIType(type: null): Promise<boolean>{
        // TODO: type needs model
        // TODO: implement
        return false
    }

}