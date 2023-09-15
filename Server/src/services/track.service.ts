import { Prisma, Track } from ".prisma/client"
import database from "./database.service"
import GeoJSONUtils from "../utils/geojsonUtils"

import distance from "@turf/distance"
import nearestPointOnLine, { NearestPointOnLine } from "@turf/nearest-point-on-line"
import * as turfMeta from "@turf/meta"
import * as turfHelpers from "@turf/helpers"
import bearing from "@turf/bearing"
import { logger } from "../utils/logger"
import { HTTPError } from "../models/error"

/**
 * Service for track management. This also includes handling the GeoJSON track data.
 */
export default class TrackService {
	/**
	 * Create and save a track, track data gets enriched in this process
	 * @param track `GeoJSON.FeatureCollection` of points of track, this has to be ordered
	 * @param start starting location of the track
	 * @param dest destination of track (currently in modelling start and end point do not differentiate)
	 * @returns `Track` if creation was successful
	 */
	public static createTrack(
		track: GeoJSON.FeatureCollection<GeoJSON.Point>,
		start: string,
		dest: string
	): Promise<Track> {
		const enrichedTrack = this.enrichTrackData(track)

		// Note: Based on FeatureCollection it is not possible to cast to Prisma.InputJsonValue directly
		// Therefore we cast it into unknown first. (Also recommended by Prisma itself)
		return database.tracks.save({ start, stop: dest, data: enrichedTrack as unknown as Prisma.InputJsonValue })
	}

	/**
	 * Update an already saved track, track data gets enriched in this process
	 * @param track The track to update.
	 * @param path `GeoJSON.FeatureCollection` of points of track, this has to be ordered
	 * @param start starting location of the track
	 * @param dest destination of track (currently in modelling start and end point do not differentiate)
	 * @returns `Track` if creation was successful
	 */
	public static updateTrack(
		track_uid: number,
		path: GeoJSON.FeatureCollection<GeoJSON.Point>,
		start: string,
		dest: string
	): Promise<Track> {
		const enrichedTrack = this.enrichTrackData(path)

		// Note: Based on FeatureCollection it is not possible to cast to Prisma.InputJsonValue directly
		// Therefore we cast it into unknown first. (Also recommended by Prisma itself)
		return database.tracks.update(track_uid, {
			start,
			stop: dest,
			data: enrichedTrack as unknown as Prisma.InputJsonValue
		})
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
	 * @param track `Track` to use for calculation
	 * @returns track kilometer of `position` projected on `track`
	 */
	public static getPointTrackKm(position: GeoJSON.Feature<GeoJSON.Point>, track: Track): number {
		// get the track kilometer value from projected point
		const projectedPoint = this.getProjectedPointOnTrack(position, track)
		return GeoJSONUtils.getTrackKm(projectedPoint)
	}

	/**
	 * Calculate percentage value for given track kilometer of given track
	 * @param trackKm track kilometer value to convert to percentage
	 * @param track `Track` to use for calculation as reference
	 * @returns percentage value of `trackKm` regarding `track`
	 */
	public static getTrackKmAsPercentage(trackKm: number, track: Track): number {
		// get total track length in kilometers
		const trackLength = this.getTrackLength(track)

		// check if track kilometer is within bounds
		if (trackKm < 0 || trackKm > trackLength) {
			throw new HTTPError(`Expected track kilometer to be between 0 and ${trackLength}, but got ${trackKm}.`, 500)
		}

		// convert to percentage
		return (trackKm / trackLength) * 100
	}

	/**
	 * Project a position onto a track
	 * @param position position to project onto the track
	 * @param track `Track` to project `position` onto
	 * @returns track point, which is the `position` projected onto `track`, enriched with a track kilometer value
	 */
	public static getProjectedPointOnTrack(
		position: GeoJSON.Feature<GeoJSON.Point>,
		track: Track
	): GeoJSON.Feature<GeoJSON.Point> {
		// converting feature collection of points from track to linestring to project position onto it
		const trackData = GeoJSONUtils.parseGeoJSONFeatureCollectionPoints(track.data)
		const lineStringData: GeoJSON.Feature<GeoJSON.LineString> = turfHelpers.lineString(turfMeta.coordAll(trackData))

		// projecting point on linestring of track
		// this also computes on which line segment this point is, the distance to position and the distance along the track
		const projectedPoint: NearestPointOnLine = nearestPointOnLine(lineStringData, position)

		// for easier access we set the property of track kilometer to the already calculated value
		if (projectedPoint.properties["location"] == null) {
			// this is a slight overreaction as we can still return the projected point, but the track kilometer property will not be accessible
			throw new HTTPError(
				`Turf error: Could not calculate nearest point on line correctly for position ${JSON.stringify(
					position
				)} and for linestring of track with id ${track.uid}.`,
				500
			)
		}
		GeoJSONUtils.setTrackKm(projectedPoint, projectedPoint.properties["location"])
		return projectedPoint
	}

	/**
	 * Calculate current heading of track for a given distance / track kilometer
	 * @param track `Track` to get heading for
	 * @param trackKm distance of `track` to get heading for
	 * @returns current heading (0-359) of `track` at distance `trackKm`
	 */
	public static getTrackHeading(track: Track, trackKm: number): number {
		// TODO quite inefficient? did not found anything from turf, that could do this in a simple way
		// TODO: maybe enrich track with bearing as well

		// validate track kilometer value
		const trackLength = this.getTrackLength(track)
		if (trackKm < 0 || trackKm > trackLength) {
			throw new HTTPError(
				`Unexpected value for track kilometer: ${trackKm}. This needs to be more than 0 and less than ${trackLength}.`,
				500
			)
		}

		// get track data
		const trackData = GeoJSONUtils.parseGeoJSONFeatureCollectionPoints(track.data)

		// check if we are right at the beginning of the track (not covered by loop below)
		if (trackKm == 0) {
			return bearing(trackData.features[0], trackData.features[1]) + 180
		}

		// iterate through track data and check if track kilometer is reached
		for (let i = 1; i < trackData.features.length; i++) {
			const trackPoint = trackData.features[i]
			const trackPointKm = GeoJSONUtils.getTrackKm(trackPoint)
			if (trackKm <= trackPointKm) {
				return bearing(trackData.features[i - 1], trackPoint)
			}
		}

		throw new HTTPError(
			`Track kilometer value ${trackKm} could not be found while iterating track points of track with id ${track.uid}.`,
			500
		)
	}

	/**
	 * Look for the closest track for a given position
	 * @param position position to search the closest track for
	 * @returns closest `Track` for `position`
	 */
	public static async getClosestTrack(position: GeoJSON.Feature<GeoJSON.Point>): Promise<Track> {
		const tracks = await database.tracks.getAll()
		// there are no tracks at all
		if (tracks.length == 0) {
			throw new HTTPError(`No track was found.`, 404)
		}

		// find closest track by iterating
		let minDistance = Number.POSITIVE_INFINITY
		let minTrack = -1
		for (let i = 0; i < tracks.length; i++) {
			const trackData = GeoJSONUtils.parseGeoJSONFeatureCollectionPoints(tracks[i].data)

			// converting feature collection of points to linestring to measure distance
			const lineStringData: GeoJSON.Feature<GeoJSON.LineString> = turfHelpers.lineString(turfMeta.coordAll(trackData))
			// this gives us the nearest point on the linestring including the distance to that point
			const closestPoint: NearestPointOnLine = nearestPointOnLine(lineStringData, position)
			if (closestPoint.properties["dist"] == null) {
				logger.warn(
					`Turf error: Could not calculate nearest point on line correctly for position ${JSON.stringify(
						position
					)} and for linestring of track with id ${tracks[i].uid}.`
				)
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
			throw new HTTPError(`Somehow no closest track was found even after iterating all existing tracks.`, 500)
		} else {
			return tracks[minTrack]
		}
	}

	/**
	 * Get total distance for a given track. This is just for easier access as the track kilometer
	 * of the last track point is essentially the length of the track.
	 * @param track `Track` to get the length of
	 * @returns lenth of `track` in kilometers if possible
	 */
	public static getTrackLength(track: Track): number {
		// load track data
		const trackData = GeoJSONUtils.parseGeoJSONFeatureCollectionPoints(track.data)

		// get last points track kilometer
		const trackPointsLength = trackData.features.length
		const trackLength = GeoJSONUtils.getTrackKm(trackData.features[trackPointsLength - 1])
		return trackLength
	}

	/**
	 * Wrapper for converting internal presentation of track data as points to a linestring
	 * @param track `Track` to get linestring for
	 * @returns GeoJSON feature of a linestring. This only contains pure coordinates (i.e. no property values).
	 */
	public static getTrackAsLineString(track: Track): GeoJSON.Feature<GeoJSON.LineString> {
		const trackData = GeoJSONUtils.parseGeoJSONFeatureCollectionPoints(track.data)
		return turfHelpers.lineString(turfMeta.coordAll(trackData))
	}
}
