import { POI, POIType, Track } from ".prisma/client"
import database from "./database.service"
import TrackService from "./track.service"
import GeoJSONUtils from "../utils/geojsonUtils"
import { logger } from "../utils/logger"

/**
 * Service for POI (point of interest) management.
 */
export default class POIService {
	/**
	 * Create a new POI
	 * @param position position of new POI, a value for the track kilometer when mapped on track will be added
	 * @param name name of new POI
	 * @param type `POIType` of new POI
	 * @param track `Track` the new POI belongs to, if no track is given, the closest will be chosen
	 * @param description optional description of the new POI
	 * @param isTurningPoint is the new POI a point, where one can turn around their vehicle (optional)
	 * @returns created `POI` if successful, `null` otherwise
	 */
	public static async createPOI(
		position: GeoJSON.Feature<GeoJSON.Point>,
		name: string,
		type: POIType,
		track?: Track,
		description?: string,
		isTurningPoint?: boolean
	): Promise<POI | null> {
		// TODO: check if poi is anywhere near the track
		// get closest track if none is given
		if (track == null) {
			const tempTrack = await TrackService.getClosestTrack(position)
			if (tempTrack == null) {
				logger.error(`No closest track was found for position ${JSON.stringify(position)}.`)
				return null
			}
			track = tempTrack
		}

		// add kilometer value
		const enrichedPoint = await this.enrichPOIPosition(position, track)
		if (enrichedPoint == null) {
			logger.error(`The position ${JSON.stringify(position)} could not be enriched.`)
			return null
		}
		// typecast to any, because JSON is expected
		return database.pois.save(name, type.uid, track.uid, enrichedPoint as any, description, isTurningPoint)
	}

	/**
	 * Add value of track kilometer to properties for a given point
	 * @param point position of POI to enrich
	 * @param track optional `TracK`, which is used to compute the track kilometer, if none is given the closest will be used
	 * @returns point with added track kilometer, `null` if not successful
	 */
	public static async enrichPOIPosition(
		point: GeoJSON.Feature<GeoJSON.Point>,
		track?: Track
	): Promise<GeoJSON.Feature<GeoJSON.Point> | null> {
		// initialize track if none is given
		if (track == null) {
			const tempTrack = await TrackService.getClosestTrack(point)
			if (tempTrack == null) {
				logger.error(`No closest track was found for position ${JSON.stringify(point)}.`)
				return null
			}
			track = tempTrack
		}

		// calculate and set track kilometer
		const trackKm = await TrackService.getPointTrackKm(point, track)
		if (trackKm == null) {
			logger.error(`Could not get track distance for position ${JSON.stringify(point)} on track with id ${track.uid}.`)
			return null
		}
		GeoJSONUtils.setTrackKm(point, trackKm)
		return point
	}

	/**
	 * Wrapper to get distance of poi in kilometers along the assigned track
	 * @param poi `POI` to get the distance for
	 * @returns track kilometer of `poi`, `null` if computation was not possible
	 */
	public static async getPOITrackDistanceKm(poi: POI): Promise<number | null> {
		// get closest track if none is given
		const poiPos = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position)
		if (poiPos == null) {
			logger.error(`Position ${JSON.stringify(poi.position)} could not be parsed.`)
			return null
		}

		// get track distance in kilometers
		let poiTrackKm = GeoJSONUtils.getTrackKm(poiPos)
		if (poiTrackKm == null) {
			if (poiTrackKm == null) {
				logger.info(`Position of POI with ID ${poi.uid} is not enriched yet.`)
				// the poi position is not "enriched" yet.
				// Therefore, obtain and typecast the position
				const poiPos = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position)
				if (poiPos == null) {
					logger.error(`Position ${JSON.stringify(poi.position)} could not be parsed.`)
					return null
				}

				// get track of POI to enrich it
				const track = await database.tracks.getById(poi.trackId)
				if (track == null) {
					logger.error(`Track with id ${poi.trackId} was not found.`)
					return null
				}

				// then enrich it with the given track
				const enrichedPos = await this.enrichPOIPosition(poiPos, track)
				if (enrichedPos == null) {
					logger.error(`Could not enrich position of POI with ID ${poi.uid}.`)
					return null
				}
				// try to update the poi in the database, now that we have enriched it
				if ((await database.pois.update(poi.uid, undefined, undefined, undefined, undefined, enrichedPos)) == null) {
					logger.info(`Could not update POI with id ${poi.uid} after enriching it.`)
				}

				// and re-calculate poiTrackKm (we do not care that much at this point if the update was successful)
				poiTrackKm = GeoJSONUtils.getTrackKm(enrichedPos)
				if (poiTrackKm == null) {
					logger.error(`Could not get track kilometer of POI position ${JSON.stringify(enrichedPos)}.`)
					return null
				}
			}
		}
		return poiTrackKm
	}

	/**
	 * Compute distance of given POI as percentage along the assigned track
	 * @param poi `POI` to compute distance for
	 * @returns percentage of track distance of `poi`, `null` if computation was not possible
	 */
	public static async getPOITrackDistancePercentage(poi: POI): Promise<number | null> {
		// get track length
		const track = await database.tracks.getById(poi.trackId)
		if (track == null) {
			logger.error(`Track with id ${poi.trackId} was not found.`)
			return null
		}

		const trackLength = TrackService.getTrackLength(track)
		if (trackLength == null) {
			logger.error(`Length of track with id ${track.uid} could not be calculated.`)
			return null
		}

		const poiDistKm = await this.getPOITrackDistanceKm(poi)
		if (poiDistKm == null) {
			logger.error(`Could not get track kilometer of POI with ID ${poi.uid}.`)
			return null
		}

		// compute percentage
		return (poiDistKm / trackLength) * 100
	}

	/**
	 * Search for POI's on a track
	 * @param track `Track` to search on for POI's
	 * @param type `POIType` to filter the returned POI's by
	 * @returns `POI[]` of all POI's along the given `track`
	 */
	public static async getAllPOIsForTrack(track: Track, type?: POIType): Promise<POI[]> {
		// no type given, just return database query
		if (type == null) {
			return database.pois.getAll(track.uid)
		}

		// filter by type
		let trackPOIs = await database.pois.getAll(track.uid)
		trackPOIs = trackPOIs.filter(function (poi, _index, _poiList) {
			return poi.typeId == type.uid
		})
		return trackPOIs
	}
}
