import { logger } from "../utils/logger" // TODO: use this
import { Track } from ".prisma/client"
import database from "./database.service"

import distance from "@turf/distance"
import nearestPointOnLine from "@turf/nearest-point-on-line"
import * as turfMeta from "@turf/meta"
import * as turfHelpers from "@turf/helpers"

/**
 * Service for track management. This also includes handling the GeoJSON track data.
 */
export default class TrackService {
    /**
     * Create and save a track, track data gets enriched in this process
     * @param track `GeoJSON.FeatureCollection` of points of track, this has to be ordered
     * @param start starting location of the track
     * @param dest destination of track (currently in modelling start and end point do not differentiate)
     * @returns `Track` if creation was successful, `null` otherwise
     */
    public static async createTrack(
        track: GeoJSON.FeatureCollection<GeoJSON.Point>,
        start: string,
        dest: string
    ): Promise<Track | null> {
        const enrichedTrack = await this.enrichTrackData(track)
        return database.tracks.save(
            start,
            dest,
            JSON.parse(JSON.stringify(enrichedTrack))
        )
    }

    /**
     * Assign each point of given track data an id and its track kilometer
     * @param track `GeoJSON.FeatureCollection` of points of track to process
     * @returns enriched data of track
     */
    private static async enrichTrackData(
        track: GeoJSON.FeatureCollection<GeoJSON.Point>
    ): Promise<GeoJSON.FeatureCollection<GeoJSON.Point>> {
        // iterate over all features
        turfMeta.featureEach(track, function (feature, featureIndex) {
            // compute track kilometer and id for each point
            if (featureIndex > 0) {
                const prevFeature = track.features[featureIndex - 1]
                feature.id = featureIndex
                // (we know, that each previous feature has initialized properties)
                feature.properties = {
                    trackKm:
                        prevFeature.properties!["trackKm"] +
                        distance(prevFeature, feature)
                }

                // initialize first point
            } else {
                feature.id = 0
                feature.properties = { trackKm: 0.0 }
            }
        })

        return track
    }

    /**
     * Search track by id
     * @param id id of track to search for
     * @returns `Track` if `id` is found, `null` otherwise
     */
    public static async getTrackById(id: number): Promise<Track | null> {
        return database.tracks.getById(id)
    }

    /**
     * Searches for nearest track and nearest points on it for a given point
     * @param point point to search nearest points for
     * @param track optional, if given points only on this track will be searched
     * @returns `[[GeoJSON.Point], Track]` where the first element is an array of (at most two, depending on how many points are found) points
     * on the track given by the second element. This also means, that the returned `Track` is the nearest track for the given point or `track`
     * if it was given. The returned points are the nearest track points i.e. they have additional properties e.g. track kilometer values.
     * `null` is returned, if no point was found.
     */
    public static async getNearestTrackPoints(
        point: GeoJSON.Feature<GeoJSON.Point>,
        track?: Track
    ): Promise<[GeoJSON.FeatureCollection<GeoJSON.Point>, Track] | null> {
        // if no track is given find closest
        if (track == null) {
            const tracks = await this.getAllTracks()
            // there are no tracks at all
            if (tracks.length == 0) {
                return null
            }

            // find closest track by iterating
            let minDistance = Number.POSITIVE_INFINITY
            let minTrack = -1
            for (let i = 0; i < tracks.length; i++) {
                // TODO: this does not feel right?!
                const trackData: GeoJSON.FeatureCollection<GeoJSON.Point> =
                    JSON.parse(JSON.stringify(tracks[i].data))

                // converting feature collection of points to linestring to measure distance
                const lineStringData: GeoJSON.Feature<GeoJSON.LineString> =
                    turfHelpers.lineString(turfMeta.coordAll(trackData))
                const closestPoint: GeoJSON.Feature<GeoJSON.Point> =
                    nearestPointOnLine(lineStringData, point)
                if (
                    closestPoint.properties == null ||
                    closestPoint.properties["dist"] == null
                ) {
                    // TODO: this should not happen, so maybe log this
                    continue
                }

                // update closest track
                if (closestPoint.properties["dist"] < minDistance) {
                    minDistance = closestPoint.properties["dist"]
                    minTrack = i
                }
            }

            // check if closest track was found
            if (minTrack < 0) {
                return null
            } else {
                track = tracks[minTrack]
            }
        }

        // converting feature collection of points to linestring to measure distance
        // TODO: this does not feel right?!
        const trackData: GeoJSON.FeatureCollection<GeoJSON.Point> = JSON.parse(
            JSON.stringify(track.data)
        )
        const lineStringData: GeoJSON.Feature<GeoJSON.LineString> =
            turfHelpers.lineString(turfMeta.coordAll(trackData))
        const closestPoint: GeoJSON.Feature<GeoJSON.Point> = nearestPointOnLine(
            lineStringData,
            point
        )
        if (
            closestPoint.properties == null ||
            closestPoint.properties["index"] == null ||
            closestPoint.properties["location"] == null
        ) {
            // TODO: this should not happen, so maybe log this
            return null
        }

        // TODO: this should not happen, log this
        if (
            trackData.features.length !=
            lineStringData.geometry.coordinates.length
        ) {
            return null
        }

        // compute closest line segment and limiting track points
        const closestLineSegment = closestPoint.properties["index"]
        const trackDistance = closestPoint.properties["location"]
        const trackPoint0 = trackData.features[closestLineSegment]
        const trackPoint1 = trackData.features[closestLineSegment + 1]

        // check if closest point is exactly one of the two limiting track points, only return that in this case
        // this could also be done with @turf/boolean-equal, which would be more appropriate, but would be an additional dependency and function call
        if (
            trackPoint0.properties != null &&
            trackPoint0.properties["trackKm"] != null &&
            trackPoint0.properties["trackKm"] == trackDistance
        ) {
            return [turfHelpers.featureCollection([trackPoint0]), track]
        }
        if (
            trackPoint1.properties != null &&
            trackPoint1.properties["trackKm"] != null &&
            trackPoint1.properties["trackKm"] == trackDistance
        ) {
            return [turfHelpers.featureCollection([trackPoint1]), track]
        }

        // normal case:
        return [
            turfHelpers.featureCollection([trackPoint0, trackPoint1]),
            track
        ]
    }

    /**
     * Get total distance for a given track. This is just for easier access as the track kilometer
     * of the last track point is essentially the length of the track.
     * @param track `Track` to get the length of
     * @returns lenth of `track` in kilometers if possible, `null` otherwise (this could be caused by invalid track data)
     */
    public static async getTrackLength(track: Track): Promise<number | null> {
        const trackData: GeoJSON.FeatureCollection<GeoJSON.Point> = JSON.parse(
            JSON.stringify(track.data)
        )
        const trackPointsLength = trackData.features.length
        if (
            trackData.features[trackPointsLength - 1].properties == null ||
            trackData.features[trackPointsLength - 1].properties!["trackKm"] ==
                null
        ) {
            // TODO: log this, track data invalid, probably check if track exists and try to get it by id
            return null
        }
        return trackData.features[trackPointsLength - 1].properties!["trackKm"]
    }

    /**
     * Wrapper for converting internal presentation of track data as points to a linestring
     * @param track `Track` to get linestring for
     * @returns GeoJSON feature of a linestring. This only contains pure coordinates (i.e. no property values).
     */
    public static async getTrackAsLineString(
        track: Track
    ): Promise<GeoJSON.Feature<GeoJSON.LineString>> {
        const trackData: GeoJSON.FeatureCollection<GeoJSON.Point> = JSON.parse(
            JSON.stringify(track.data)
        )
        return turfHelpers.lineString(turfMeta.coordAll(trackData))
    }

    /**
     * Search for all tracks that have a given location as start or end point
     * @param location location to search for
     * @returns all `Track[]`, which have `location` either as their starting location or as their destination, thus could be empty
     */
    public static async searchTrackByLocation(
        location: string
    ): Promise<Track[]> {
        return database.tracks.getByLocation(location)
    }

    /**
     *
     * @returns all tracks
     */
    public static async getAllTracks(): Promise<Track[]> {
        return database.tracks.getAll()
    }

    /**
     * Assign a new path of GeoJSON points to an existing track
     * @param track existing track
     * @param path new path for `track`
     * @returns `Track` with updated path
     */
    public static async updateTrackPath(
        track: Track,
        path: GeoJSON.FeatureCollection<GeoJSON.Point>
    ): Promise<Track | null> {
        const enrichedTrack = await this.enrichTrackData(path)
        return database.tracks.update(
            track.uid,
            undefined,
            undefined,
            JSON.parse(JSON.stringify(enrichedTrack))
        )
    }

    /**
     * Update starting location of a track
     * @param track `Track` to update
     * @param newStart new starting location of `track`
     * @returns updated `Track` if successful, `null` otherwise
     */
    public static async setStart(
        track: Track,
        newStart: string
    ): Promise<Track | null> {
        return database.tracks.update(track.uid, newStart)
    }

    /**
     * Update destination of a track
     * @param track `Track` to update
     * @param newDest new destination of `track`
     * @returns updated `Track` if successful, `null` otherwise
     */
    public static async setDestination(
        track: Track,
        newDest: string
    ): Promise<Track | null> {
        return database.tracks.update(track.uid, undefined, newDest)
    }

    /**
     * Delete track
     * @param track track to delete
     * @returns `true` if deletion was successfull, `false` otherwise
     */
    public static async removeTrack(track: Track): Promise<boolean> {
        return database.tracks.remove(track.uid)
    }
}
