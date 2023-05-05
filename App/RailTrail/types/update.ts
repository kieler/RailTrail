export interface UpdateResponse {
  vehicleId?: number // Vehicle id of the user (in case change was detected?)
  vehiclesNearUser: Vehicle[] // Vehicles that should be marked on the map
  distanceTraveled?: number // Usage stat in the top of the app
  distanceToNextCrossing: number
  distanceToNextVehicle: number
  passingPosition?: PassPosition // Only set if needed
}

export interface Vehicle {
  lat: number
  lng: number
  headingTowardsUser: boolean
}

export interface PassPosition {
  lat: number
  lng: number
}

export interface UpdateRequest {
  vehicleId?: number
  lat: number
  lng: number
  speed?: number
  timestamp?: number
  direction?: number
}

// Examples
const responseFull: UpdateResponse = {
  vehicleId: 1,
  vehiclesNearUser: [
    {
      lat: 54.323334,
      lng: 10.139444,
      headingTowardsUser: true,
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
  lat: 54.323334,
  lng: 10.139444,
  speed: 15.123,
  timestamp: 1683108130021,
  direction: 317.11,
}

const requestMinimal: UpdateRequest = {
  lat: 54.323334,
  lng: 10.139444,
}
