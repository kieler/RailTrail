import { POIType } from "./api_types";

export const PositionSchema = {
  id: "Position",
  type: "object",
  properties: {
    lat: { type: "number" },
    lng: { type: "number" },
  },
  required: ["lat", "lng"],
};

export const PointOfInterestSchema = {
  id: "PointOfInterest",
  type: "object",
  properties: {
    type: {
      type: "number",
      minimum: 0,
      maximum: 5,
    },
    name: { type: "string" },
    pos: { $ref: "Position" },
    isTurningPoint: { type: "boolean" },
    required: ["type", "pos", "isTurningPoint"],
  },
};

export const InitResponseSchema = {
  id: "Position",
  type: "object",
  properties: {
    trackId: { type: "number" },
    trackName: { type: "string" },
    trackPath: { type: "GeoJSON" }, // FIXME: Find out how to deal with this
    trackStart: { type: "string" },
    trackEnd: { type: "string" },
    pointsOfInterest: { type: "array", items: { $ref: "PointOfInterest" } },
    required: [
      "trackId",
      "trackName",
      "trackStart",
      "trackEnd",
      "pointsOfInterest",
    ],
  },
};

export const TrackListEntrySchema = {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
  },
  required: ["id", "name"],
};

export const InitRequestSchema = {
  type: "object",
  properties: {
    pos: { $ref: "Position" },
  },
  required: ["pos"],
};

export const VehicleSchema = {
  id: "Vehicle",
  type: "object",
  properties: {
    id: { type: "number" },
    pos: { $ref: "Position" },
    headingTowardsUser: { type: "boolean" },
    heading: { type: "number", minimum: 0, maximum: 359 },
  },
  required: ["id", "pos"],
};

export const UpdateResponse = {
  type: "object",
  properties: {
    vehicleId: { type: "number" },
    vehiclesNearUser: { type: "array", items: { $ref: "Vehicle" } },
    distanceTraveled: { type: "number" },
    distanceToNextCrossing: { type: "number" },
    distanceToNextVehicle: { type: "number" },
    passingPosition: { $ref: "Position" },
  },
  required: [
    "vehiclesNearUser",
    "distanceToNextCrossing",
    "distanceToNextVehicle",
  ],
};

export const UpdateRequestSchema = {
  type: "object",
  properties: {
    vehicleId: { type: "number" },
    pos: { $ref: "Position" },
    speed: { type: "number" },
    timestamp: { type: "number" },
    direction: { type: "number" },
  },
};

export const AuthenticationRequestSchema = {
    type: "object",
    properties: {
        username: {type: "string"},
        password: {type: "string"}
    },
    required:["username", "password"]
};

export const AuthenticationResponse = {
    type : "object",
    properties: {
        token: {type: "string"}
    },
    required: ["token"]
};
