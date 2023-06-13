export const PositionSchema = {
  "id": "Position",
  "type": "object",
  "properties": {
    "lat": { "type": "number" },
    "lng": { "type": "number" },
  },
  "required": ["lat", "lng"],
  "additionalProperties": false
}

export const TrackListEntrySchema = {
  "id": "TrackListEntry",
  "type": "object",
  "properties": {
    "id": {
      "type": "number"
    },
    "name": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "name"
  ],
  "additionalProperties": false
}

export const InitRequestSchema = {
  "id": "InitRequest",
  "type": "object",
  "properties": {
    "pos": { "$ref": "Position" },
  },
  "required": ["pos"],
  "additionalProperties": false
}

export const InitResponseSchema = {
  "id": "InitResponse",
  "type": "object",
  "properties": {
    "trackId": { "type": "number" },
    "trackName": { "type": "string" },
    "trackPath": { "type": "GeoJSON" },
    "trackLength": { "type": "number" },
    "pointsOfInterest": { "type": "array", 
    "items": { "$ref": "PointOfInterest" } },
  },
  "required": [
    "trackId",
    "trackName",
    "trackLength",
    "pointsOfInterest",
  ],
  "additionalProperties": false
}

export const PointOfInterestSchema = {
  "id": "PointOfInterest",
  "type": "object",
  "properties": {
    "type": {
      "type": "number",
      "minimum": 0,
      "maximum": 5,
    },
    "name": { "type": "string" },
    "pos": { "$ref": "Position" },
    "percentagePosition": {
      "type": "number",
      "minimum": 0, "maximum": 101,
    },
    "isTurningPoint": { "type": "boolean" },
  },
  "required": ["type", "pos", "percentagePosition",
   "isTurningPoint"],
   "additionalProperties": false
}


export const VehicleSchema = {
  "id": "Vehicle",
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "pos": { "$ref": "Position" },
    "headingTowardsUser": { "type": "boolean" },
    "heading": { "type": "number", "minimum": 0, "maximum": 359 },
  },
  "required": ["id", "pos", 
  "headingTowardsUser", "heading"],
  "additionalProperties": false
}

export const UpdateRequestWithLocationEnabledSchema = {
  "id": "UpdateRequestWithLocationEnabled",
  "type": "object",
  "properties": {
    "vehicleId": { "type": "number" },
    "pos": { "$ref": "Position" },
  },
  "required": [
    "vehicleId",
    "pos"
  ],
  "additionalProperties": false
}

export const UpdateResponseWithLocationEnabledSchema = {
  "id": "UpdateResponseWithLocationEnabled",
  "type": "object",
  "properties": {
    "vehiclesNearUser": { "type": "array", 
    "items": { "$ref": "Vehicle" } },
    "percentagePositionOnTrack": { "type": "number" },
    "passingPosition": { "$ref": "Position" },
  },
  "required": [
    "vehiclesNearUser",
    "passingPosition"
  ],
  "additionalProperties": false
}

export const UpdateRequestWithLocationNotEnabledSchema = {
  "id": "UpdateRequestWithLocationNotEnabled",
  "type": "object",
  "properties": {
    "vehicleId": { "type": "number" },
  },
  "required": ["vehicleId"],
  "additionalProperties": false
}

export const UpdateResponseWithLocationNotEnabledSchema = {
  "id": "UpdateResponseWithLocationNotEnabled",
  "type": "object",
  "properties": {
    "pos": { "$ref": "Position" },
    "heading": { "type": "number" },
    "vehiclesNearUser": { "type": "array", 
    "items": { "$ref": "Vehicle" } },
    "percentagePositionOnTrack": { "type": "number",
     "minimum": 0, "maximum": 101 },
    "passingPosition": { "$ref": "Position" },
  },
  "required": ["pos", "vehicleId", 
  "heading", "vehiclesNearUser", "percentagePositionOnTrack"],
  "additionalProperties": false
}