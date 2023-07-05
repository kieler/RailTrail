export const AuthenticationRequestSchemaWebsite = {
    "id": "AuthenticationRequestWebsite",
    "type": "object",
    "properties": {
        "username": { "type": "string" },
        "password": { "type": "string" }
    },
    "required": ["username", "password"],
    "additionalProperties": false
}

export const AuthenticationResponseSchemaWebsite = {
    "id": "AuthenticationResponseWebsite",
    "type": "object",
    "properties": {
        "token": { "type": "string" }
    },
    "required": ["token"],
    "additionalProperties": false
}

export const TrackListEntrySchemaWebsite = {
    "id": "TrackListEntryWebsite",
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

export const InitResponseSchemaWebsite = {
    "id": "InitResponseWebsite",
    "type": "object",
    "properties": {
        "trackPath": {
            "type": "GeoJSON"
        },
        "pointsOfInterest": {
            "type": "array", "items": {
                "$ref": "PointOfInterestWebsite"
            }
        }
    },
    "required": [
        "trackPath",
        "pointsOfInterest"
    ],
    "additionalProperties": false
}

export const PointOfInterestSchemaWebsite = {
    "id": "PointOfInterestWebsite",
    "type": "object",
    "properties": {
        "id": {
            "type": "number"
        },
        "type": { "type": "number", "minimum": 0, "maximum": 5 },
        "name": { "type": "string" },
        "pos": { "$ref": "PositionWebsite" },
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

export const UpdateAddPOISchemaWebsite = {
    "id": "UpdateAddPOIWebsite",
    "type": "object",
    "properties": {
        "id": { "type": "number" },
        "type": { "type": "number", "minimum": 0, "maximum": 5 },
        "name": { "type": "string" },
        "pos": { "$ref": "PositionWebsite" },
        "isTurningPoint": { "type": "boolean" }
    },
    "required": ["type", "pos", "isTurningPoint"],
    "additionalProperties": false
}

export const PositionSchemaWebsite = {
    "id": "PositionWebsite",
    "type": "object",
    "properties": {
        "lat": { "type": "number" },
        "lng": { "type": "number" }
    },
    "required": ["lat", "lng"],
    "additionalProperties": false
}

export const VehicleSchemaWebsite = {
    "id": "VehicleWebsite",
    "type": "object",
    "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "pos": { " $ref": "PositionWebsite" },
        "heading": { "type": "number", "minimum": 0, "maximum": 360 },
        "batteryLevel": { "type": "number", "minimum": 0, "maximum": 101 }
    },
    required: ["id", "name", "pos", "batteryLevel"],
    "additionalProperties": false
}

export const PasswordChangeSchemaWebsite = {
    "id": "PasswordChangeWebsite",
    "type": "object",
    "properties": {
        "oldPassword": { "type": "string" },
        "newPassword": { "type": "string" }
    },
    "required": ["oldPassword", "newPassword"],
    "additionalProperties": false
}

export const UserListSchemaWebsite = {
    "id": "UserListWebsite",
    "type": "object",
    "properties": {
        "users": {
            "type": "array", "items": { "$ref": "UserWebsite" }
        }
    },
    "required": ["users"],
    "additionalProperties": false
}

export const UserSchemaWebsite = {
    "id": "UserWebsite",
    "type": "object",
    "properties": {
        "id": { "type": "number" },
        "username": { "type": "string" }
    },
    "required": ["id", "username"]
}

export const TrackMetaDataSchemaWebsite = {
    "id": "TrackMetaDataWebsite",
    "type": "object",
    "properties": {
        "trackName": { "type": "string" }
    },
    "required": ["trackName"],
    "additionalProperties": false
}

export const TrackMetaDataResponseSchemaWebsite = {
    "id": "TrackMetaDataResponseWebsite",
    "type": "object",
    "properties": {
        "uploadId": { "type": "number" }
    },
    "required": ["uploadId"],
    "additionalProperties": false
}

export const TrackPathSchemaWebsite = {
    "id": "TrackPathWebsite",
    "type": "object",
    "properties": {
        "start": { "type": "string" },
        "end": { "type": "string" },
        "path": { "type": "FeatureCollection<Point, GeoJsonProperties>" }
    },
    "required": ["start", "end", "path"],
    "additionalProperties": false
}

export const VehicleListItemSchemaWebsite = {
    "id" : "VehicleListItemWebsite",
    "type" : "object",
    "properties": {
        "uid": { "type" : "number"},
        "name": { "type" : "string"},
        "physicalName": { "type" : "string"},
        "typeId": { "type" : "number"},
        "trackerId": { "type" : "string"},
    },
    "required": ["uid", "name", "physicalName", "typeId"],
    "additionalProperties": false
}

export const VehicleCrUSchemaWebsite = {
    "id" : "VehicleCrUWebsite",
    "type" : "object",
    "properties": {
        "uid": { "type" : "number"},
        "name": { "type" : "string"},
        "physicalName": { "type" : "string"},
        "typeId": { "type" : "number"},
        "trackerId": { "type" : "string"},
    },
    "required": ["name", "physicalName", "typeId"],
    "additionalProperties": false
}

export const VehicleTypeListItemSchemaWebsite = {
    "id" : "VehicleTypeListItemWebsite",
    "type" : "object",
    "properties": {
        "uid": { "type" : "number"},
        "name": { "type" : "string"},
        "description": { "type" : "string"},
    },
    "required": ["uid", "name"],
    "additionalProperties": false
}

export const VehicleTypeCrUSchemaWebsite = {
    "id" : "VehicleTypeCrUWebsite",
    "type" : "object",
    "properties": {
        "uid": { "type" : "number"},
        "name": { "type" : "string"},
        "description": { "type" : "string"},
    },
    "required": ["name"],
    "additionalProperties": false
}