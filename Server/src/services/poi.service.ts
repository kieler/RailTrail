import { POI, POIType, Prisma, Track } from ".prisma/client"
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
	 * @returns created `POI` if successful
	 * @throws `HTTPError`
	 * 	- if the closest track could not be computed (if none is given)
	 * 	- if the position could not be enriched
	 * @throws PrismaError, if saving the created POI to database was not possible
	 */
	public static async createPOI(
		position: GeoJSON.Feature<GeoJSON.Point>,
		name: string,
		type: POIType,
		track?: Track,
		description?: string,
		isTurningPoint?: boolean
	): Promise<POI> {
		// TODO: check if poi is anywhere near the track
		// get closest track if none is given
		if (track == null) {
			track = await TrackService.getClosestTrack(position)
		}

		// add kilometer value
		const enrichedPoint = await this.enrichPOIPosition(position, track)

		// Note: geopos is from type GeoJSON.Feature and can't be parsed directly into Prisma.InputJsonValue
		// Therefore we cast it into unknown first.
		return database.pois.save({
			name,
			typeId: type.uid,
			trackId: track.uid,
			position: enrichedPoint as unknown as Prisma.InputJsonValue,
			description: description,
			isTurningPoint: isTurningPoint ?? false
		})
	}

	/**
	 * Add value of track kilometer to properties for a given point
	 * @param point position of POI to enrich
	 * @param track optional `TracK`, which is used to compute the track kilometer, if none is given the closest will be used
	 * @returns point with added track kilometer
	 * @throws `HTTPError`
	 * 	- if the track kilometer value could not be computed
	 * 	- if the closest track could not be computed (if none is given)
	 */
	public static async enrichPOIPosition(
		point: GeoJSON.Feature<GeoJSON.Point>,
		track?: Track
	): Promise<GeoJSON.Feature<GeoJSON.Point>> {
		// initialize track if none is given
		if (track == null) {
			track = await TrackService.getClosestTrack(point)
		}

		// calculate and set track kilometer
		const trackKm = TrackService.getPointTrackKm(point, track)
		GeoJSONUtils.setTrackKm(point, trackKm)
		return point
	}

	/**
	 * Wrapper to get distance of poi in kilometers along the assigned track
	 * @param poi `POI` to get the distance for
	 * @returns track kilometer of `poi`
	 * @throws `HTTPError`
	 * 	- if the track kilometer value of `poi` could not be accessed after trying to enrich it
	 * 	- if the position of `poi` could not be parsed
	 * 	- if the position of `poi` could not be enriched
	 * @throws PrismaError
	 * 	- if accessing the track of `poi` from the database was not possible
	 * 	- if updating `poi` in the database was not possible
	 */
	public static async getPOITrackDistanceKm(poi: POI): Promise<number> {
		// get closest track if none is given
		const poiPos = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position)

		// get track distance in kilometers
		let poiTrackKm
		try {
			poiTrackKm = GeoJSONUtils.getTrackKm(poiPos)
		} catch (err) {
			logger.info(`Position of POI with ID ${poi.uid} is not enriched yet.`)
			// the poi position is not "enriched" yet.
			// Therefore, obtain and typecast the position
			const poiPos = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position)

			// get track of POI to enrich it
			const track = await database.tracks.getById(poi.trackId)

			// then enrich it with the given track
			const enrichedPos = await this.enrichPOIPosition(poiPos, track)
			// try to update the poi in the database, now that we have enriched it
			await database.pois.update(poi.uid, { position: enrichedPos as unknown as Prisma.InputJsonValue })

			// and re-calculate poiTrackKm (we do not care that much at this point if the update was successful)
			poiTrackKm = GeoJSONUtils.getTrackKm(enrichedPos)
		}
		return poiTrackKm
	}

	/**
	 * Compute distance of given POI as percentage along the assigned track
	 * @param poi `POI` to compute distance for
	 * @returns percentage of track distance of `poi`
	 * @throws `HTTPError`
	 * 	- if the track length could not be computed
	 * 	- if the track kilometer of `poi` could not be computed
	 * @throws PrismaError, if the track of `poi` could not be accessed in the database
	 */
	public static async getPOITrackDistancePercentage(poi: POI): Promise<number> {
		// get track length
		const track = await database.tracks.getById(poi.trackId)
		const trackLength = TrackService.getTrackLength(track)

		// compute percentage
		const poiDistKm = await this.getPOITrackDistanceKm(poi)
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
