import { POI, POIType, Track, Vehicle } from ".prisma/client"
import database from "./database.service"
import TrackService from "./track.service"
import VehicleService from "./vehicle.service"
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
				return null
			}
			track = tempTrack
		}

		// add kilometer value
		const enrichedPoint = await this.enrichPOIPosition(position, track)
		if (enrichedPoint == null) {
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
				// TODO: log this
				return null
			}
			track = tempTrack
		}

		// calculate and set track kilometer
		const trackKm = await TrackService.getPointTrackKm(point, track)
		if (trackKm == null) {
			// TODO: log this
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
			// TODO: log this
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
					return null
				}

				// get track of POI to enrich it
				const track = await database.tracks.getById(poi.trackId)
				if (track == null) {
					return null
				}

				// then enrich it with the given track
				const enrichedPos = await this.enrichPOIPosition(poiPos, track)
				if (enrichedPos == null) {
					logger.error(`Could not enrich position of POI with ID ${poi.uid}`)
					return null
				}
				// try to update the poi in the database, now that we have enriched it
				if ((await database.pois.update(poi.uid, undefined, undefined, undefined, undefined, enrichedPos)) == null) {
					logger.info(`Could not update POI with id ${poi.uid} after enriching it.`)
				}

				// and re-calculate poiTrackKm (we do not care that much at this point if the update was successful)
				poiTrackKm = GeoJSONUtils.getTrackKm(enrichedPos)
				if (poiTrackKm == null) {
					logger.error(`Could not get distance as percentage of POI with ID ${poi.uid}.`)
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
			return null
		}

		const trackLength = TrackService.getTrackLength(track)
		if (trackLength == null) {
			return null
		}

		const poiDistKm = await this.getPOITrackDistanceKm(poi)
		if (poiDistKm == null) {
			logger.error(`Could not get distance as percentage of POI with ID ${poi.uid}.`)
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
		const trackPOIs = await database.pois.getAll(track.uid)
		trackPOIs.filter(function(poi, _index, _poiList) {
			return poi.typeId == type.uid
		})
		return trackPOIs
	}

// THIS METHOD IS NOT USED ANYMORE BUT HAS SOME LOGICS IN IT
	/**
	 * Search for nearby POI's either within a certain distance or by amount
	 * @param point point to search nearby POI's from
	 * @param track `Track` to search on for POIs. If none is given, the closest will be used.
	 * @param count amount of points, that should be returned. If none given only one (i.e. the nearest) will be returned.
	 * @param heading could be either 1 or -1 to search for POI only towards the end and start of the track (seen from `point`) respectively
	 * @param maxDistance maximum distance in track-kilometers to the POI's
	 * @param type `POIType` to filter the returned POI's by
	 * @returns `POI[]`, either #`count` of nearest POI's or all POI's within `maxDistance` of track-kilometers, but at most #`count`.
	 * That is the array could be empty.
	 */
	public static async getNearbyPOIs(
		point: GeoJSON.Feature<GeoJSON.Point> | Vehicle,
		track?: Track,
		count?: number,
		heading?: number,
		maxDistance?: number,
		type?: POIType
	): Promise<POI[] | null> {
		// TODO: testing
		// TODO: just copied from VehicleService, i.e. there is probably a better solution
		// extract vehicle position if a vehicle is given instead of a point
		if ((<Vehicle>point).uid) {
			// also use the assigned track if none is given
			if (track == null) {
				const tempTrack = await database.tracks.getById((<Vehicle>point).trackId)
				if (tempTrack == null) {
					return null
				}
				track = tempTrack
			}

			const vehiclePosition = await VehicleService.getVehiclePosition(<Vehicle>point)
			if (vehiclePosition == null) {
				return null
			}
			point = vehiclePosition
		}

		// now we can safely assume, that this is actually a point
		const searchPoint = <GeoJSON.Feature<GeoJSON.Point>>point
		// check if a track is given, else initialize it with the closest one
		if (track == null) {
			const tempTrack = await TrackService.getClosestTrack(searchPoint)
			if (tempTrack == null) {
				// TODO: log this
				return null
			}
			track = tempTrack
		}

		// compute distance of point mapped on track
		const trackDistance = await TrackService.getPointTrackKm(searchPoint, track)
		if (trackDistance == null) {
			// TODO: log this
			return null
		}

		// search for all POIs on the track
		let allPOIsForTrack = await this.getAllPOIsForTrack(track, type)

		// filter pois by heading if given
		if (heading != null) {
			// invalid heading
			if (heading != 1 && heading != -1) {
				// TODO: log this
				return null
			}

			allPOIsForTrack.filter(async function(poi, _index, _pois) {
				const poiTrackKm = await POIService.getPOITrackDistanceKm(poi)
				if (poiTrackKm == null) {
					return false
				}
				return poiTrackKm - trackDistance * heading > 0
			})
		}

		// filter pois by distance if given
		if (maxDistance != null) {
			allPOIsForTrack.filter(async function(poi, _index, _pois) {
				const poiTrackKm = await POIService.getPOITrackDistanceKm(poi)
				if (poiTrackKm == null) {
					return false
				}
				// consider both directions (heading would filter those out)
				return Math.abs(poiTrackKm - trackDistance) < maxDistance
			})
		}
		// sort POI's by distance to searched point
		allPOIsForTrack = allPOIsForTrack.sort(function(poi0, poi1) {
			// parse POI position
			const POIPos0 = GeoJSONUtils.parseGeoJSONFeaturePoint(poi0.position)
			const POIPos1 = GeoJSONUtils.parseGeoJSONFeaturePoint(poi1.position)
			if (POIPos0 == null || POIPos1 == null) {
				// TODO: log this
				return 0
			}

			// if this happens, we cannot sort the POI's
			const POIPos0TrackKm = GeoJSONUtils.getTrackKm(POIPos0)
			const POIPos1TrackKm = GeoJSONUtils.getTrackKm(POIPos1)
			if (POIPos0TrackKm == null || POIPos1TrackKm == null) {
				// TODO: log this, maybe some other handling
				return 0
			}

			// compute distances to vehicle and compare
			const distanceToVehicle0 = Math.abs(POIPos0TrackKm - trackDistance)
			const distanceToVehicle1 = Math.abs(POIPos1TrackKm - trackDistance)
			return distanceToVehicle0 - distanceToVehicle1
		})

		// check if a certain amount is searched for
		count = count == null ? 1 : count

		// if less POI's were found then we need to return, we return every POI that we have
		if (count > allPOIsForTrack.length) {
			return allPOIsForTrack
		}

		// only return first #count of POI's
		allPOIsForTrack.slice(0, count)
		return allPOIsForTrack
	}
}
