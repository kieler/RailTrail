export const PositionSchemaApp = {
	id: "PositionApp",
	type: "object",
	properties: {
		lat: { type: "number" },
		lng: { type: "number" }
	},
	required: ["lat", "lng"],
	additionalProperties: false
}

export const TrackListEntrySchemaApp = {
	id: "TrackListEntryApp",
	type: "object",
	properties: {
		id: {
			type: "number"
		},
		name: {
			type: "string"
		}
	},
	required: ["id", "name"],
	additionalProperties: false
}

export const InitRequestSchemaApp = {
	id: "InitRequestApp",
	type: "object",
	properties: {
		pos: { $ref: "PositionApp" }
	},
	required: ["pos"],
	additionalProperties: false
}

export const InitResponseSchemaApp = {
	id: "InitResponseApp",
	type: "object",
	properties: {
		trackId: { type: "number" },
		trackName: { type: "string" },
		trackPath: { type: "GeoJSON" },
		trackLength: { type: "number" },
		pointsOfInterest: {
			type: "array",
			items: { $ref: "PointOfInterestApp" }
		}
	},
	required: ["trackId", "trackName", "trackLength", "pointsOfInterest"],
	additionalProperties: false
}

export const PointOfInterestSchemaApp = {
	id: "PointOfInterestApp",
	type: "object",
	properties: {
		type: {
			type: "number",
			minimum: 0,
			maximum: 5
		},
		name: { type: "string" },
		pos: { $ref: "PositionApp" },
		percentagePosition: {
			type: "number",
			minimum: 0,
			maximum: 101
		},
		isTurningPoint: { type: "boolean" }
	},
	required: ["type", "pos", "percentagePosition", "isTurningPoint"],
	additionalProperties: false
}

export const VehicleSchemaApp = {
	id: "VehicleApp",
	type: "object",
	properties: {
		id: { type: "number" },
		pos: { $ref: "PositionApp" },
		headingTowardsUser: { type: "boolean" },
		heading: { type: "number", minimum: 0, maximum: 359 }
	},
	required: ["id", "pos", "headingTowardsUser", "heading"],
	additionalProperties: false
}

export const UpdateRequestSchemaApp = {
	id: "UpdateRequestApp",
	type: "object",
	properties: {
		vehicleId: { type: "number" },
		pos: { $ref: "PositionApp" }
	},
	required: ["vehicleId", "pos"],
	additionalProperties: false
}

export const UpdateResponseAppSchema = {
	id: "UpdateResponseApp",
	type: "object",
	properties: {
		pos: { $ref: "PositionApp" },
		heading: { type: "number" },
		vehiclesNearUser: {
			type: "array",
			items: { $ref: "VehicleApp" }
		},
		percentagePositionOnTrack: {
			type: "number",
			minimum: 0,
			maximum: 101
		},
		speed: { type: "number" },
		passingPosition: { $ref: "PositionApp" }
	},
	required: ["pos", "heading", "vehiclesNearUser", "percentagePositionOnTrack", "speed"],
	additionalProperties: false
}

export const GetUidSchema = {
	id: "GetUidSchema",
	type: "object",
	properties: {
		vehicleName: { type: "string" },
		trackId: { type: "number" }
	},
	required: ["vehicleName", "trackId"],
	additionalProperties: false
}

export const ReturnUidSchema = {
	id: "ReturnUidSchema",
	type: "object",
	properties: {
		vehicleId: { type: "number" }
	},
	required: ["vehicleId"],
	additionalProperties: false
}
