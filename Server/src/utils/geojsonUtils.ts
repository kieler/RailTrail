/**
 * Some utilities for simpler handling of GeoJSON
 */
export default class GeoJSONUtils {
	// ### wrappers for accessibility ###

	/**
	 * Get longitude for given GeoJSON point
	 */
	public static getLongitude(point: GeoJSON.Feature<GeoJSON.Point>): number {
		return point.geometry.coordinates[0]
	}

	/**
	 * Get latitude for given GeoJSON point
	 */
	public static getLatitude(point: GeoJSON.Feature<GeoJSON.Point>): number {
		return point.geometry.coordinates[1]
	}

	/**
	 * Get track kilometer for given GeoJSON point (basically a wrapper for accessing this property)
	 * @param point GeoJSON point to get the track kilometer for
	 * @returns track kilometer if available, `null` otherwise
	 */
	public static getTrackKm(point: GeoJSON.Feature<GeoJSON.Point>): number | null {
		if (point?.properties == null || point.properties["trackKm"] == null) {
			return null
		}
		return point.properties["trackKm"]
	}

	/**
	 * Set track kilometer for given GeoJSON point (basically a wrapper for accessing this property)
	 * @param point GeoJSON point to set the track kilometer for
	 * @param trackKm track kilometer for `point`
	 * @returns `point` with set track kilometer
	 */
	public static setTrackKm(point: GeoJSON.Feature<GeoJSON.Point>, trackKm: number): GeoJSON.Feature<GeoJSON.Point> {
		if (point.properties == null) {
			point.properties = {}
		}
		point.properties["trackKm"] = trackKm
		return point
	}

	// ### helpers to create GeoJSON features and feature collections ###

	/**
	 * Creates a GeoJSON feature of a point for given coordinates (only two-dimensional)
	 * @param longitude longitude of coordinate
	 * @param latitude latitude of coordinate
	 * @returns GeoJSON feature of a point with given coordinates
	 */
	public static GeoJSONFeaturePointFromCoordinates(
		longitude: number,
		latitude: number
	): GeoJSON.Feature<GeoJSON.Point> {
		return {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [longitude, latitude]
			},
			properties: {}
		}
	}

	/**
	 * Creates a GeoJSON feature collection of points with the given list of coordinates (only two-dimensional)
	 * @param coordinateList list of coordinates (ATTENTION: coordinates need to be in the format specified by GeoJSON
	 * standard, RFC 7946, i.e. it needs to be a pair [longitude, latitude])
	 * @returns GeoJSON feature collection of points with given coordinates
	 */
	public static GeoJSONFeatureCollectionPointsFromCoordinatesArray(
		coordinateList: [number, number][]
	): GeoJSON.FeatureCollection<GeoJSON.Point> {
		const featureCol: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: "FeatureCollection", features: [] }
		coordinateList.forEach(function(coordinates) {
			const feature = GeoJSONUtils.GeoJSONFeaturePointFromCoordinates(coordinates[0], coordinates[1])
			featureCol.features.push(feature)
		})
		return featureCol
	}

	// ### helpers for safer parsing of JSON to GeoJSON ###

	/**
	 * Parses JSON to a GeoJSON feature of a point (if possible)
	 * @param json JSON to parse
	 * @returns parsed GeoJSON feature or `null` if an error occured while parsing
	 */
	public static parseGeoJSONFeaturePoint(json: unknown): GeoJSON.Feature<GeoJSON.Point> | null {
		if (this.isGeoJSONFeaturePoint(json)) {
			return json as GeoJSON.Feature<GeoJSON.Point>
		} else if (this.isGeoJSONPosition(json)) {
			// If we just have plain 2D coordinates, construct a point feature.
			const feature: GeoJSON.Feature<GeoJSON.Point> = {
				type: "Feature",
				properties: {},
				geometry: {
					type: "Point",
					coordinates: json
				}
			}
			return feature
		}
		return null
	}

	/**
	 * Parses JSON to a GeoJSON feature collection of points (if possible)
	 * @param json JSON to parse
	 * @returns parsed GeoJSON feature collection or `null` if an error occured while parsing
	 */
	public static parseGeoJSONFeatureCollectionPoints(json: unknown): GeoJSON.FeatureCollection<GeoJSON.Point> | null {
		if (this.isGeoJSONFeatureCollectionPoints(json)) {
			return json as GeoJSON.FeatureCollection<GeoJSON.Point>
		}
		return null
	}

	/**
	 * type guard for GeoJSON feature of a point
	 */
	private static isGeoJSONFeaturePoint(feature: unknown): feature is GeoJSON.Feature<GeoJSON.Point> {
		const f = feature as GeoJSON.Feature<GeoJSON.Point>
		return f.type === "Feature" && f.properties !== undefined && this.isGeoJSONPoint(f.geometry)
	}

	/**
	 * type guard for GeoJSON feature collection of points
	 */
	private static isGeoJSONFeatureCollectionPoints(
		featureCol: unknown
	): featureCol is GeoJSON.FeatureCollection<GeoJSON.Point> {
		const fc = featureCol as GeoJSON.FeatureCollection<GeoJSON.Point>
		if (fc.type !== "FeatureCollection" || fc.features === undefined) {
			return false
		}
		let checkFeatures = true
		fc.features.forEach(function(feature) {
			checkFeatures = GeoJSONUtils.isGeoJSONFeaturePoint(feature) ? checkFeatures : false
		})
		return checkFeatures
	}

	/**
	 * type guard for GeoJSON point
	 */
	private static isGeoJSONPoint(point: unknown): point is GeoJSON.Point {
		const p = point as GeoJSON.Point
		return p.type === "Point" && this.isGeoJSONPosition(p.coordinates)
	}

	/**
	 * type guard for GeoJSON position
	 */
	private static isGeoJSONPosition(pos: unknown): pos is GeoJSON.Position {
		const p = pos as GeoJSON.Position
		return p.length >= 2 && p.length <= 3 && typeof p[0] === "number" && typeof p[1] === "number"
	}
}
