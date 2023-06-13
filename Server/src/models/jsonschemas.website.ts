
export const AuthenticationRequestSchema = {
    "id": "AuthenticationRequest",
    "type": "object",
    "properties": {
        "username": { "type": "string" },
        "password": { "type": "string" }
    },
    "required": ["username", "password"],
    "additionalProperties": false
}

export const AuthenticationResponseSchema = {
    "id": "AuthenticationResponse",
    "type": "object",
    "properties": {
        "token": { "type": "string" }
    },
    "required": ["token"],
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

export const InitResponseSchema = {
    "id": "InitResponse",
    "type": "object",
    "properties": {
        "trackPath": {
            "type": "GeoJSON"
        },
        "pointsOfInterest": {
            "type": "array", "items": {
                "$ref": "PointOfInterest"
            }
        }
    },
    "required": [
        "trackPath",
        "pointsOfInterest"
    ],
    "additionalProperties": false
}

export const PointOfInterest = {
    "id": "PointOfInterest",
    "type": "object",
    "properties": {
        "id": {
            "type": "number"
        },
        "type": { "type": "number", "minimum": 0, "maximum": 5 },
        "name": { "type": "string" },
        "pos": { "$ref": "Position" },
        "isTurningPoint": { "type": "boolean" }
    },
    "required": [
        "id",
        "type",
        "pos",
        "isTurningPoint"
    ]
    ,
    "additionalProperties": false
}

export const UpdateAddPOISchema = {
    "id": "UpdateAddPOI",
    "type": "object",
    "properties": {
        "id": { "type": "number" },
        "type": { "type": "number", "minimum": 0, "maximum": 5 },
        "name": { "type": "string" },
        "pos": { "$ref": "Position" },
        "isTurinngPoint": { "type": "boolean" }
    },
    "required": ["type", "pos", "isTurningPoint"],
    "additionalProperties": false
}

export const PositionSchema = {
    "id": "Position",
    "type": "object",
    "properties": {
        "lat": { "type": "number" },
        "lng": { "type": "number" }
    },
    "required": ["lat", "lng"],
    "additionalProperties": false
}

export const VehicleSchema = {
    "id": "Vehicle",
    "type": "object",
    "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "pos": {" $ref": "Position" },
        "heading": { "type": "number", "minimum": 0, "maximum": 360 },
        "batteryLevel": { "type": "number", "minimum": 0, "maximum": 101 }
    },
    required: ["id", "name", "pos", "batteryLevel"],
    "additionalProperties": false
}

export const PasswordChangeSchema = {
    "id": "PasswordChange",
    "type": "object",
    "properties": {
        "oldPassword": { "type": "string" },
        "newPassword": { "type": "string" }
    },
    "required": ["oldPassword", "newPassword"],
    "additionalProperties": false
}

export const UserListSchema = {
    "id": "UserList",
    "type": "object",
    "properties": {
        "users": {
            "type": "array", "items": {"$ref": "User" }
        }
    },
    "required": ["users"],
    "additionalProperties": false
}

export const UserSchema = {
    "id": "User",
    "type": "object",
    "properties": {
        "id": { "type": "number" },
        "username": { "type": "string" }
    },
    "required": ["id", "username"]
}

export const TrackMetaDataSchema = {
    "id": "TrackMetaData",
    "type": "object",
    "properties": {
        "trackName": { "type": "string" }
    },
    "required": ["trackName"],
    "additionalProperties": false
}

export const TrackMetaDataResponseSchema = {
    "id": "TrackMetaDataResponse",
    "type": "object",
    "properties": {
        "uploadId": { "type": "number" }
    },
    "required": ["uploadId"],
    "additionalProperties": false
}

export const TrackPathSchema = {
    "id": "TrackPath",
    "type": "object",
    "properties": {
        "uploadId": { "type": "number" },
        "path": { "type": "GeoJSON" }
    },
    "required": ["uploadId", "path"],
    "additionalProperties": false
}