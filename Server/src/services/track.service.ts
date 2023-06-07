import { logger } from "../utils/logger"
// import { Track } from "../models"; // TODO: model

/**
 * Service for track management. This also includes handling the GeoJSON track data.
 */
export default class TrackService{
    
    /**
     * Create and save a track, enriches track data
     * @param track `GeoJSON.FeatureCollection` of track
     * @param name name of the track
     * @returns `Track` if creation was successful, `null` otherwise
     */
    public static async createTrack(track: GeoJSON.FeatureCollection<GeoJSON.Point, GeoJSON.GeoJsonProperties>, name: string): Promise<null>{

        // TODO: implement
        
        // is this the right way? (0 would be index while iterating through features)
        // let point: GeoJSON.Point | undefined = track.features.at(0)?.geometry
        // if (point) {
        //     // do stuff w/ point
        //     point.coordinates
        // }

        // processing GeoJSON should include assigning each point an unique id and its track-kilometer to make it more accessible

        return null
    }

    /**
     * Search track by id
     * @param id id of track to search for
     * @returns `Track` if `id` is found, `null` otherwise
     */
    public static async getTrackById(id: number): Promise<null>{
        // TODO: implement
        return null
    }

    /**
     * Searches for nearest track and nearest points on it for a given point
     * @param point point to search nearest points for
     * @param track optional, if given points only on this track will be searched
     * @returns `[[GeoJSON.Point], Track]` where the first element is an array of (at most two, depending on how many points are found) points 
     * on the track given by the second element. This also means, that the returned `Track` is the nearest track for the given point or `track`
     * if it was given. The returned points are the nearest track points i.e. they have additional properties e.g. track kilometer values.
     * `[[null], null]` is returned, if no point was found.
     */
    public static async getNearestTrackPoints(point: GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties>, track = null): Promise<null>{
        // TODO: track needs model Track
        // TODO: implement
        return null
    }

    /**
     * 
     * @returns all tracks
     */
    public static async getAllTracks(): Promise<null>{
        return null
    }

    /**
     * Add a point to an existing track 
     * @param point point to add
     * @param track track to add the point to
     * @returns `Track` with added point, `null` if addition was not possible
     */
    public static async addTrackPoint(point: GeoJSON.Feature<GeoJSON.Point, GeoJSON.GeoJsonProperties>, track: null): Promise<null>{
        // TODO: track needs model Track
        // TODO: implement
        return null
    }

    /**
     * Rename existing track
     * @param track existing track
     * @param newName new name of the track
     * @returns renamed `Track` if renaming was successful, `null` otherwise
     */
    public static async renameTrack(track: null, newName: string): Promise<null>{
        // TODO: track needs model Track
        // TODO: implement
        return null
    }

    /**
     * Delete point from an existing track
     * @param pointId id of point to remove
     * @param track track the point belongs to
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removeTrackPoint(pointId: number, track: null): Promise<boolean>{
        // TODO: track needs model Track
        // TODO: implement
        return false
    }

    /**
     * Delete track
     * @param track track to delete
     * @returns `true` if deletion was successfull, `false` otherwise
     */
    public static async removeTrack(track: null): Promise<boolean>{
        // TODO: track needs model Track
        // TODO: implement
        return false
    }
}