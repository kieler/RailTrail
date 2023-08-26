import { Track } from ".prisma/client"
import database from "./database.service"
import GeoJSONUtils from "../utils/geojsonUtils"

import distance from "@turf/distance"
import nearestPointOnLine from "@turf/nearest-point-on-line"
import * as turfMeta from "@turf/meta"
import * as turfHelpers from "@turf/helpers"
import bearing from "@turf/bearing"

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
	public static createTrack(
		track: GeoJSON.FeatureCollection<GeoJSON.Point>,
		start: string,
		dest: string
	): Promise<Track | null> {
		const enrichedTrack = this.enrichTrackData(track)

		return database.tracks.save(start, dest, enrichedTrack)
	}

	/**
	 * Update an already saved track, track data gets enriched in this process
	 * @param track The track to update.
	 * @param path `GeoJSON.FeatureCollection` of points of track, this has to be ordered
	 * @param start starting location of the track
	 * @param dest destination of track (currently in modelling start and end point do not differentiate)
	 * @returns `Track` if creation was successful, `null` otherwise
	 */
	public static updateTrack(
		track: Track,
		path: GeoJSON.FeatureCollection<GeoJSON.Point>,
		start: string,
		dest: string
	): Promise<Track | null> {
		const enrichedTrack = this.enrichTrackData(path)

		return database.tracks.update(track.uid, start, dest, enrichedTrack)
	}

	/**
	 * Assign each point of given track data its track kilometer
	 * @param track `GeoJSON.FeatureCollection` of points of track to process
	 * @returns enriched data of track
	 */
	private static enrichTrackData(
		track: GeoJSON.FeatureCollection<GeoJSON.Point>
	): GeoJSON.FeatureCollection<GeoJSON.Point> {
		// iterate over all features
		turfMeta.featureEach(track, function (feature, featureIndex) {
			// compute track kilometer for each point
			if (featureIndex > 0) {
				const prevFeature = track.features[featureIndex - 1]
				// (we know, that each previous feature has initialized properties)
				const prevTrackKm = GeoJSONUtils.getTrackKm(prevFeature)
				GeoJSONUtils.setTrackKm(feature, prevTrackKm! + distance(prevFeature, feature))

				// initialize first point
			} else {
				GeoJSONUtils.setTrackKm(feature, 0.0)
			}
		})

		return track
	}

	/**
	 * Calculate projected track kilometer for a given position
	 * @param position position to calculate track kilometer for (does not need to be on the track)
	 * @param track optional`Track` to use for calculation, if none is given, the closest will be used
	 * @returns track kilometer of `position` projected on `track`, `null` if an error occurs
     */
	 public static async getPointTrackKm(position: GeoJSON.Feature<GeoJSON.Point>, track?: Track): Promise<number | null>{

        // get the track kilometer value from projected point
        const projectedPoint = await this.getProjectedPointOnTrack(position, track)
	  	if (projectedPoint == null) {
            return null
        }
        return GeoJSONUtils.getTrackKm(projectedPoint)
    }

    /**
     * Project a position onto a track
     * @param position position to project onto the track
     * @param track optional `Track` to project `position` onto, closest will be used, if none is given
     * @returns track point, which is the `position` projected onto `track`, enriched with a track kilometer value, `null` if an error occurs
	 */
	public static async getProjectedPointOnTrack(
		position: GeoJSON.Feature<GeoJSON.Point>,
		track?: Track
	): Promise<GeoJSON.Feature<GeoJSON.Point> | null> {
		// check if track is given and else find the closest one
        if (track == null) {
            const tempTrack = await this.getClosestTrack(position)

            // if an error occured while trying to find the closest track, there is nothing we can do
            if (tempTrack == null) {
                return null
            }
            track = tempTrack
        }

        // converting feature collection of points from track to linestring to project position onto it
		const trackData = GeoJSONUtils.parseGeoJSONFeatureCollectionPoints(track.data)
        if (trackData == null) {
            // TODO: log this
            return null
        }
        const lineStringData: GeoJSON.Feature<GeoJSON.LineString> = turfHelpers.lineString(turfMeta.coordAll(trackData))

        // projecting point on linestring of track
        // this also computes on which line segment this point is, the distance to position and the distance along the track
        const projectedPoint = nearestPointOnLine(lineStringData, position)

        // for easier access we set the property of track kilometer to the already calculated value
        if (projectedPoint.properties["location"] == null) {
            // TODO: log this
            // this is a slight overreaction as we can still return the projected point, but the track kilometer property will not be accessible
            return null
        }
        GeoJSONUtils.setTrackKm(projectedPoint, projectedPoint.properties["location"])
        return projectedPoint
    }

    /**
     * Calculate current heading of track for a given distance / track kilometer
     * @param track `Track` to get heading for
     * @param trackKm distance of `track` to get heading for
     * @returns current heading (0-359) of `track` at distance `trackKm`, `null` if an error occurs
     */
    public static async getTrackHeading(track: Track, trackKm: number): Promise<number | null>{
        // TODO quite inefficient? did not found anything from turf, that could do this in a simple way

        // validate track kilometer value
        const trackLength = this.getTrackLength(track)
        if (trackLength == null) {
            // TODO: log this
            return null
        }
        if (trackKm < 0 || trackKm > trackLength) {
            return null
        }

        // get track data
        const trackData = GeoJSONUtils.parseGeoJSONFeatureCollectionPoints(track.data)
        if (trackData == null) {
            // TODO: log this
            return null
        }

        // check if we are right at the beginning of the track (not covered by loop below)
        if (trackKm == 0) {
            return bearing(trackData.features[0], trackData.features[1]) + 180
		}

		// iterate through track data and check if track kilometer is reached
        for (let i = 1; i < trackData.features.length; i++) {
            const trackPoint = trackData.features[i]
            const trackPointKm = GeoJSONUtils.getTrackKm(trackPoint)
            if (trackPointKm == null) {
                // TODO: log this, this should not happen
                return null
            }

            // actual check
            if (trackKm <= trackPointKm) {
                return bearing(trackData.features[i-1], trackPoint)
            }
        }

        // TODO: log this, this would be really weird as we validated the track kilometer value passed
        return null
    }

    /**
     * Look for the closest track for a given position
     * @param position position to search the closest track for
		* @returns closest `Track` for `position` or `null` if an error occurs
     */
    public static async getClosestTrack(position: GeoJSON.Feature<GeoJSON.Point>): Promise<Track | null> {
			const tracks = await database.tracks.getAll()
			// there are no tracks at all
			if (tracks.length == 0) {
				return null
			}

			// find closest track by iterating
			let minDistance = Number.POSITIVE_INFINITY
			let minTrack = -1
			for (let i = 0; i < tracks.length; i++) {

				const trackData = GeoJSONUtils.parseGeoJSONFeatureCollectionPoints(tracks[i].data )
				if (trackData == null) {
					// TODO: log this
					return null
				}

				// converting feature collection of points to linestring to measure distance
				const lineStringData: GeoJSON.Feature<GeoJSON.LineString> = turfHelpers.lineString(turfMeta.coordAll(trackData))
				// this gives us the nearest point on the linestring including the distance to that point
				const closestPoint: GeoJSON.Feature<GeoJSON.Point> = nearestPointOnLine(lineStringData, position)
				if (closestPoint.properties == null || closestPoint.properties["dist"] == null) {
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
            return tracks[minTrack]
        }
    }

	/**
	 * Get total distance for a given track. This is just for easier access as the track kilometer
	 * of the last track point is essentially the length of the track.
	 * @param track `Track` to get the length of
	 * @returns lenth of `track` in kilometers if possible, `null` otherwise (this could be caused by invalid track data)
	 */
	public static getTrackLength(track: Track): number | null {
		// load track data
		const trackData = GeoJSONUtils.parseGeoJSONFeatureCollectionPoints(track.data)
		if (trackData == null) {
			// TODO: log this
			return null
		}

		// get last points track kilometer
		const trackPointsLength = trackData.features.length
		const trackLength = GeoJSONUtils.getTrackKm(trackData.features[trackPointsLength - 1])
		if (trackLength == null) {
			// TODO: log this, track data invalid, probably check if track exists and try to get it by id
			return null
		}
		return trackLength
	}

    /**
     * Wrapper for converting internal presentation of track data as points to a linestring
     * @param track `Track` to get linestring for
     * @returns GeoJSON feature of a linestring. This only contains pure coordinates (i.e. no property values). `null` if an error occured.
     */
    public static getTrackAsLineString(track: Track): GeoJSON.Feature<GeoJSON.LineString> | null {
        const trackData = GeoJSONUtils.parseGeoJSONFeatureCollectionPoints(track.data)
        if (trackData == null) {
            // TODO: log this
            return null
        }
        return turfHelpers.lineString(turfMeta.coordAll(trackData))
    }

	/**
	 * Search for all tracks that have a given location as start or end point
	 * @param location location to search for
	 * @returns all `Track[]`, which have `location` either as their starting location or as their destination, thus could be empty
	 */
	public static async searchTrackByLocation(location: string): Promise<Track[]> {
		return database.tracks.getByLocation(location)
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
		const enrichedTrack = this.enrichTrackData(path)
		// typecast to any, because JSON is expected
		// typecast to any, because JSON is expected
        return database.tracks.update(track.uid, undefined, undefined, enrichedTrack as any)
	}

	/**
	 * Update starting location of a track
	 * @param track `Track` to update
	 * @param newStart new starting location of `track`
	 * @returns updated `Track` if successful, `null` otherwise
	 */
	public static async setStart(track: Track, newStart: string): Promise<Track | null> {
		return database.tracks.update(track.uid, newStart)
	}

	/**
	 * Update destination of a track
	 * @param track `Track` to update
	 * @param newDest new destination of `track`
	 * @returns updated `Track` if successful, `null` otherwise
	 */
	public static async setDestination(track: Track, newDest: string): Promise<Track | null> {
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
