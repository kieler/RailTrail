import { POI, POIType, Prisma, Track, Vehicle } from ".prisma/client"
import database from "./database.service"
import TrackService from "./track.service"
import VehicleService from "./vehicle.service"
import GeoJSONUtils from "../utils/geojsonUtils"

import distance from "@turf/distance"
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
	 *
	 * @param id id of POI to search for
	 * @returns `POI` with `id` if it exists, `null` otherwise
	 */
	public static async getPOIById(id: number): Promise<POI | null> {
		return database.pois.getById(id)
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
				if ((await database.pois.update(poi.uid, {position: enrichedPos as unknown as Prisma.InputJsonValue})) == null) {
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

			allPOIsForTrack.filter(async function (poi, _index, _pois) {
				const poiTrackKm = await POIService.getPOITrackDistanceKm(poi)
				if (poiTrackKm == null) {
					return false
				}
				return poiTrackKm - trackDistance * heading > 0
			})
		}

		// filter pois by distance if given
		if (maxDistance != null) {
			allPOIsForTrack.filter(async function (poi, _index, _pois) {
				const poiTrackKm = await POIService.getPOITrackDistanceKm(poi)
				if (poiTrackKm == null) {
					return false
				}
				// consider both directions (heading would filter those out)
				return Math.abs(poiTrackKm - trackDistance) < maxDistance
			})
		}
		// sort POI's by distance to searched point
		allPOIsForTrack = allPOIsForTrack.sort(function (poi0, poi1) {
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
		trackPOIs.filter(function (poi, _index, _poiList) {
			return poi.typeId == type.uid
		})
		return trackPOIs
	}

	/**
	 * Set a new position for an existing POI
	 * @param poi `POI` to update
	 * @param position new position of `poi`
	 * @returns updated `POI` if successful, `null` otherwise
	 */
	public static async setPOIPosition(poi: POI, position: GeoJSON.Feature<GeoJSON.Point>): Promise<POI | null> {
		// enrich and update
		const POITrack = await database.tracks.getById(poi.trackId)
		if (POITrack == null) {
			// TODO: this really should not happen, how to handle? delete POI?
			return null
		}
		const enrichedPoint = await this.enrichPOIPosition(position, POITrack)
		if (enrichedPoint == null) {
			return null
		}

		// Note: Based on Feature it is not possible to cast to Prisma.InputJsonValue directly
		// Therefore we cast it into unknown first. (Also recommended by Prisma itself)
		return database.pois.update(poi.uid, { position: enrichedPoint as unknown as Prisma.InputJsonValue })
	}

	/**
	 * Rename an existing POI
	 * @param poi `POI` to rename
	 * @param newName new name of `poi`
	 * @returns renamed `POI` if successful, `null` otherwise
	 */
	public static async renamePOI(poi: POI, newName: string): Promise<POI | null> {
		return database.pois.update(poi.uid, { name: newName })
	}

	/**
	 * Update description for a given POI
	 * @param poi `POI` to update description for
	 * @param newDesc new description for `poi`
	 * @returns updated `POI` if successful, `null` otherwise
	 */
	public static async updateDescription(poi: POI, newDesc: string): Promise<POI | null> {
		return database.pois.update(poi.uid, { description: newDesc })
	}

	/**
	 * Set new type of POI
	 * @param poi `POI` to update
	 * @param type new type of `poi`
	 * @returns updated `POI` if successful, `null` otherwise
	 */
	public static async setPOIType(poi: POI, type: POIType): Promise<POI | null> {
		return database.pois.update(poi.uid, { typeId: type.uid })
	}

	/**
	 * Set track for POI
	 * @param poi `POI` to set track for
	 * @param track new `Track` for `poi`
	 * @returns updated `POI` if successful, `null` otherwise
	 */
	public static async setPOITrack(poi: POI, track: Track): Promise<POI | null> {
		// update track kilometer value first
		const poiPos = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position)
		if (poiPos == null) {
			// TODO: log this
			return null
		}
		const updatedPOIPos = await this.enrichPOIPosition(poiPos, track)
		if (updatedPOIPos == null) {
			return null
		}

		// update poi's track and track kilometer

		// Note: Based on Feature it is not possible to cast to Prisma.InputJsonValue directly
		// Therefore we cast it into unknown first. (Also recommended by Prisma itself)
		return database.pois.update(poi.uid, {
			trackId: track.uid,
			position: updatedPOIPos as unknown as Prisma.InputJsonValue
		})
	}

	/**
	 * Set if a POI is a turning point
	 * @param poi `POI` to update
	 * @param isTurningPoint indicator if `poi` is a turning point
	 * @returns updated `POI` if successful, `null` otherwise
	 */
	public static async setTurningPoint(poi: POI, isTurningPoint: boolean): Promise<POI | null> {
		return database.pois.update(poi.uid, { isTurningPoint })
	}

	/**
	 * Delete existing POI
	 * @param poi `POI` to delete
	 * @returns `true`, if deletion was successful, `false` otherwise
	 */
	public static async removePOI(poi: POI): Promise<boolean> {
		return database.pois.remove(poi.uid)
	}

	// --- POI-types ---

	/**
	 * Create new POI-type
	 * @param type name of new POI-type
	 * @param icon name of an icon associated to type
	 * @param desc optional description of new POI-type
	 * @returns created `POIType` if successful, `null` otherwise
	 */
	public static async createPOIType(type: string, icon: string, desc?: string): Promise<POIType | null> {
		return database.pois.saveType({ name: type, icon, description: desc })
	}

	/**
	 *
	 * @returns all existing `POIType`s
	 */
	public static async getAllPOITypes(): Promise<POIType[]> {
		return database.pois.getAllTypes()
	}

	/**
	 * Search for POI type by a given id
	 * @param id id to search POI type by
	 * @returns `POIType` with id `id` if successful, `null` otherwise
	 */
	public static async getPOITypeById(id: number): Promise<POIType | null> {
		return database.pois.getTypeById(id)
	}

	/**
	 * Change name of existing POI-type
	 * @param type `POIType` to change name of
	 * @param newType new name for `type`
	 * @returns renamed `POIType` if successful, `null` otherwise
	 */
	public static async renamePOIType(type: POIType, newType: string): Promise<POIType | null> {
		return database.pois.updateType(type.uid, { name: newType })
	}

	/**
	 * Update description of existing POI-type
	 * @param type `POIType` to change description of
	 * @param desc new description for `type`
	 * @returns updated `POIType` if successful, `null` otherwise
	 */
	public static async setPOITypeDescription(type: POIType, desc: string): Promise<POIType | null> {
		return database.pois.updateType(type.uid, { description: desc })
	}

	/**
	 * Change icon of POI type
	 * @param type `POIType` to change the icon of
	 * @param icon name of new icon to be associated with type
	 * @returns updated `POI` if successful, `null` otherwise
	 */
	public static async setPOITypeIcon(type: POIType, icon: string): Promise<POIType | null> {
		return database.pois.updateType(type.uid, { icon })
	}

	/**
	 * Delete existing POI-type
	 * @param type `POIType` to delete
	 * @returns `true` if deletion was successful, `false` otherwise
	 */
	public static async removePOIType(type: POIType): Promise<boolean> {
		return database.pois.removeType(type.uid)
	}
}
