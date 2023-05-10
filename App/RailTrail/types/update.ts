import { Position } from "./position"
import { Vehicle } from "./vehicle"

export interface UpdateResponse {
  vehicleId?: number // Vehicle id of the user (in case change was detected?)
  vehiclesNearUser: Vehicle[] // Vehicles that should be marked on the map
  distanceTraveled?: number // Usage stat in the top of the app
  distanceToNextCrossing: number
  distanceToNextVehicle: number
  passingPosition?: Position // Only set if needed
}

export interface UpdateRequest {
  vehicleId?: number
  pos?: Position
  speed?: number
  timestamp?: number
  direction?: number
}

// Examples
const responseFull: UpdateResponse = {
  vehicleId: 1,
  vehiclesNearUser: [
    {
      id: 1,
      pos: { lat: 54.323334, lng: 10.139444 },
      headingTowardsUser: true,
      heading: 123.45,
    },
  ],
  distanceTraveled: 3.1,
  distanceToNextCrossing: 234,
  distanceToNextVehicle: 123,
  passingPosition: {
    lat: 54.323334,
    lng: 10.139444,
  },
}

const responseMinimal: UpdateResponse = {
  vehiclesNearUser: [],
  distanceToNextCrossing: 234,
  distanceToNextVehicle: 123,
}

const requestFull: UpdateRequest = {
  vehicleId: 1,
  pos: { lat: 54.323334, lng: 10.139444 },
  speed: 15.123,
  timestamp: 1683108130021,
  direction: 317.11,
}

const requestMinimal: UpdateRequest = {
  pos: { lat: 54.323334, lng: 10.139444 },
}
