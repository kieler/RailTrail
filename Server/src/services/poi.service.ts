import { logger } from "../utils/logger"
import { POI, POIType, Track, Vehicle } from ".prisma/client"
import database from "./database.service"
import TrackService from "./track.service"
import VehicleService from "./vehicle.service"
import GeoJSONUtils from "../utils/geojsonUtils"

import distance from "@turf/distance"

/**
 * Service for POI (point of interest) management.
 */
export default class POIService{

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
    public static async createPOI(position: GeoJSON.Feature<GeoJSON.Point>, name: string, type: POIType, track?: Track, description?: string, isTurningPoint?: boolean): Promise<POI | null>{

        // TODO: check if poi is anywhere near the track
        // get closest track if none is given
        if (track == null) {
            const pointsAndTrack = await TrackService.getNearestTrackPoints(position)
            if (pointsAndTrack == null) {
                return null
            }
            track = pointsAndTrack[1]
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
    private static async enrichPOIPosition(point: GeoJSON.Feature<GeoJSON.Point>, track?: Track): Promise<GeoJSON.Feature<GeoJSON.Point> | null>{
        
        // get closest track if none is given
        const pointsAndTrack = await TrackService.getNearestTrackPoints(point, track)
        if (pointsAndTrack == null) {
            return null
        }

        // compute track distance
        const nearestTrackPoints = pointsAndTrack[0]
        // initialize properties of point (do not throw away other properties)
        point.properties = point.properties == null ? {} : point.properties
        // check for only one closest point
        if (nearestTrackPoints.features.length == 1) {
            const nearestTrackPointTrackKm = GeoJSONUtils.getTrackKm(nearestTrackPoints.features[0])
            if (nearestTrackPointTrackKm == null) {
                // TODO: log this
                return null                
            }
            GeoJSONUtils.setTrackKm(point, nearestTrackPointTrackKm)
            return point
        }

        // TODO: this should not happen, log this
        if (nearestTrackPoints.features.length != 2) {
            return null
        }

        // case for two closest points
        const trackPoint0Distance = GeoJSONUtils.getTrackKm(nearestTrackPoints.features[0])
        const trackPoint1Distance = GeoJSONUtils.getTrackKm(nearestTrackPoints.features[1])
        if (trackPoint0Distance == null || trackPoint1Distance == null) {
            // TODO: log this
            return null
        }
        const totalDistance = distance(nearestTrackPoints.features[0], point) + distance(point, nearestTrackPoints.features[1])
        const trackKm = trackPoint0Distance + distance(nearestTrackPoints.features[0], point) / totalDistance * distance(nearestTrackPoints.features[0], nearestTrackPoints.features[1])
        GeoJSONUtils.setTrackKm(point, trackKm)
        return point
    }

    /**
     * 
     * @param id id of POI to search for
     * @returns `POI` with `id` if it exists, `null` otherwise
     */
    public static async getPOIById(id: number): Promise<POI | null>{
        return database.pois.getById(id)
    }

    /**
     * Wrapper to get distance of poi in kilometers along the assigned track
     * @param poi `POI` to get the distance for
     * @returns track kilometer of `poi`, `null` if computation was not possible
     */
    public static async getPOITrackDistanceKm(poi: POI): Promise<number | null>{
        // get closest track if none is given
        // typecast to any, because JSON is expected
        const poiPos = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position as any)
        if (poiPos == null) {
            // TODO: log this
            return null
        }
        const poiTrackKm = GeoJSONUtils.getTrackKm(poiPos)
        if (poiTrackKm == null) {
            // TODO: log this
            return null
        }
        return poiTrackKm
    }

    /**
     * Compute distance of given POI as percentage along the assigned track
     * @param poi `POI` to compute distance for
     * @returns percentage of track distance of `poi`, `null` if computation was not possible
     */
    public static async getPOITrackDistancePercentage(poi: POI): Promise<number | null>{
        
        // get track distance in kilometers
        const poiDistKm = await this.getPOITrackDistanceKm(poi)
        if (poiDistKm == null) {
            return null
        }
        
        // get track length
        const track = await TrackService.getTrackById(poi.trackId)
        if (track == null) {
            return null
        }
        const trackLength = await TrackService.getTrackLength(track)
        if (trackLength == null) {
            return null
        }

        // compute percentage
        return poiDistKm / trackLength * 100

    }

    /**
     * Search for nearby POI's either within a certain distance or by amount
     * @param point point to search nearby POI's from
     * @param count amount of points, that should be returned. If none given only one (i.e. the nearest) will be returned.
     * @param heading could be either 1 or -1 to search for POI only towards the end and start of the track (seen from `point`) respectively
     * @param maxDistance maximum distance in track-kilometers to the POI's
     * @param type `POIType` to filter the returned POI's by
     * @returns `POI[]`, either #`count` of nearest POI's or all POI's within `maxDistance` of track-kilometers, but at most #`count`.
     * That is the array could be empty.
     */
    public static async getNearbyPOIs(point: GeoJSON.Feature<GeoJSON.Point> | Vehicle, count?: number, heading?: number, maxDistance?: number, type?: POIType): Promise<POI[] | null>{
        // TODO: testing
        // TODO: just copied from VehicleService, i.e. there is probably a better solution
        // extract vehicle position if a vehicle is given instead of a point
        if ((<Vehicle> point).uid) {
            const vehiclePosition = await VehicleService.getVehiclePosition((<Vehicle> point))
            if (vehiclePosition == null) {
                return null
            }
            point = vehiclePosition
        }

        // now we can safely assume, that this is actually a point
        const searchPoint = <GeoJSON.Feature<GeoJSON.Point>> point
        const nearestTrackPointsAndTrack = await TrackService.getNearestTrackPoints(searchPoint)
        if (nearestTrackPointsAndTrack == null) {
            return []
        }

        // compute distance of point mapped on track (pretty equal to parts of getVehicleTrackPosition, but can not be used, because we handle a point here)
        let trackDistance = -1
        // found one closest point
        if (nearestTrackPointsAndTrack[0].features.length == 1) {
            const trackPoint0Distance = GeoJSONUtils.getTrackKm(nearestTrackPointsAndTrack[0].features[0])
            if (trackPoint0Distance == null) {
                // TODO: log this
                return null
            }
            trackDistance = trackPoint0Distance
        }
        if (nearestTrackPointsAndTrack[0].features.length != 2) {
            // TODO: log this, it should not happen at this point
            return null
        }
        const track = nearestTrackPointsAndTrack[1]
        const trackPoint0 = nearestTrackPointsAndTrack[0].features[0]
        const trackPoint1 = nearestTrackPointsAndTrack[0].features[1]

        // "normal" case with two closest points
        if (trackDistance < 0) {
            // interpolate distance
            const totalDistance = distance(trackPoint0, searchPoint) + distance(trackPoint1, searchPoint)
            const trackPoint0Distance = GeoJSONUtils.getTrackKm(trackPoint0)
            if (trackPoint0Distance == null) {
                // TODO: log this
                return null
            }
            trackDistance = trackPoint0Distance + (distance(trackPoint0, searchPoint) / totalDistance) * distance(trackPoint0, trackPoint1)
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

            allPOIsForTrack.filter(async function (poi, index, pois){
                const poiTrackKm = await POIService.getPOITrackDistanceKm(poi)
                if (poiTrackKm == null) {
                    return false
                }
                return poiTrackKm - trackDistance * heading > 0
            })
        }

        // filter pois by distance if given
        if (maxDistance != null) {
            allPOIsForTrack.filter(async function (poi, index, pois){
                const poiTrackKm = await POIService.getPOITrackDistanceKm(poi)
                if (poiTrackKm == null) {
                    return false
                }
                // consider both directions (heading would filter those out)
                return Math.abs(poiTrackKm - trackDistance) < maxDistance
            })
        }
        // sort POI's by distance to searched point
        allPOIsForTrack = allPOIsForTrack.sort(function (poi0, poi1){

            // parse POI position
            // typecasts to any, because JSON is expected
            const POIPos0 = GeoJSONUtils.parseGeoJSONFeaturePoint(poi0.position as any)
            const POIPos1 = GeoJSONUtils.parseGeoJSONFeaturePoint(poi1.position as any)
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
    public static async getAllPOIsForTrack(track: Track, type?: POIType): Promise<POI[]>{

        // no type given, just return database query
        if (type == null) {
            return database.pois.getAll(track.uid)
        }

        // filter by type
        let trackPOIs = await database.pois.getAll(track.uid)
        trackPOIs.filter(function (poi, index, poiList){
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
    public static async setPOIPosition(poi: POI, position: GeoJSON.Feature<GeoJSON.Point>): Promise<POI | null>{
        
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
        // typecast to any, because JSON is expected
        return database.pois.update(poi.uid, undefined, undefined, undefined, undefined, enrichedPoint as any)
    }

    /**
     * Rename an existing POI
     * @param poi `POI` to rename
     * @param newName new name of `poi`
     * @returns renamed `POI` if successful, `null` otherwise
     */
    public static async renamePOI(poi: POI, newName: string): Promise<POI | null>{
        return database.pois.update(poi.uid, newName)
    }

    /**
     * Update description for a given POI
     * @param poi `POI` to update description for
     * @param newDesc new description for `poi`
     * @returns updated `POI` if successful, `null` otherwise
     */
    public static async updateDescription(poi: POI, newDesc: string): Promise<POI | null>{
        return database.pois.update(poi.uid, undefined, newDesc)
    }

    /**
     * Set new type of POI
     * @param poi `POI` to update
     * @param type new type of `poi`
     * @returns updated `POI` if successful, `null` otherwise
     */
    public static async setPOIType(poi: POI, type: POIType): Promise<POI | null>{
        return database.pois.update(poi.uid, undefined, undefined, type.uid)
    }

    /**
     * Set track for POI
     * @param poi `POI` to set track for
     * @param track new `Track` for `poi`
     * @returns updated `POI` if successful, `null` otherwise
     */
    public static async setPOITrack(poi: POI, track: Track): Promise<POI | null>{

        // update track kilometer value first
        // typecast to any, because JSON is expected
        const poiPos = GeoJSONUtils.parseGeoJSONFeaturePoint(poi.position as any)
        if (poiPos == null) {
            // TODO: log this
            return null
        }
        const updatedPOIPos = await this.enrichPOIPosition(poiPos, track)
        if (updatedPOIPos == null) {
            return null
        }

        // update poi's track and track kilometer (typecast to any, because JSON is expected)
        return database.pois.update(poi.uid, undefined, undefined, undefined, track.uid, updatedPOIPos as any)
    }

    /**
     * Set if a POI is a turning point
     * @param poi `POI` to update
     * @param isTurningPoint indicator if `poi` is a turning point
     * @returns updated `POI` if successful, `null` otherwise
     */
    public static async setTurningPoint(poi: POI, isTurningPoint: boolean): Promise<POI | null>{
        return database.pois.update(poi.uid, undefined, undefined, undefined, undefined, undefined, isTurningPoint)
    }

    /**
     * Delete existing POI
     * @param poi `POI` to delete
     * @returns `true`, if deletion was successful, `false` otherwise
     */
    public static async removePOI(poi: POI): Promise<boolean>{
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
    public static async createPOIType(type: string, icon: string, desc?: string): Promise<POIType | null>{
        return database.pois.saveType(type, icon, desc)
    }

    /**
     * 
     * @returns all existing `POIType`s
     */
    public static async getAllPOITypes(): Promise<POIType[]>{
        return database.pois.getAllTypes()
    }

    /**
     * Search for POI type by a given id
     * @param id id to search POI type by
     * @returns `POIType` with id `id` if successful, `null` otherwise
     */
    public static async getPOITypeById(id: number): Promise<POIType | null>{
        return database.pois.getTypeById(id)
    }

    /**
     * Change name of existing POI-type
     * @param type `POIType` to change name of
     * @param newType new name for `type`
     * @returns renamed `POIType` if successful, `null` otherwise
     */
    public static async renamePOIType(type: POIType, newType: string): Promise<POIType | null>{
        return database.pois.updateType(type.uid, newType)
    }

    /**
     * Update description of existing POI-type
     * @param type `POIType` to change description of
     * @param desc new description for `type`
     * @returns updated `POIType` if successful, `null` otherwise
     */
    public static async setPOITypeDescription(type: POIType, desc: string): Promise<POIType | null> {
        return database.pois.updateType(type.uid, undefined, undefined, desc)
    }

    /**
     * Change icon of POI type
     * @param type `POIType` to change the icon of
     * @param icon name of new icon to be associated with type
     * @returns updated `POI` if successful, `null` otherwise
     */
    public static async setPOITypeIcon(type: POIType, icon: string): Promise<POIType | null>{
        return database.pois.updateType(type.uid, undefined, icon)
    }

    /**
     * Delete existing POI-type
     * @param type `POIType` to delete
     * @returns `true` if deletion was successful, `false` otherwise
     */
    public static async removePOIType(type: POIType): Promise<boolean>{
        return database.pois.removeType(type.uid)
    }

}