import { Position } from "./position"
import { Vehicle } from "./vehicle"

export interface UpdateResponse {
  vehiclesNearUser: Vehicle[]
  percentagePositionOnTrack: number
  passingPosition?: Position
}

export interface UpdateRequest {
  vehicleId: number
  pos: Position
}

// Examples
const response: UpdateResponse = {
  vehiclesNearUser: [
    {
      id: 1,
      pos: { lat: 54.323334, lng: 10.139444 },
      percentagePosition: 43,
      headingTowardsUser: true,
    },
  ],
  percentagePositionOnTrack: 43,
  passingPosition: {
    lat: 54.323334,
    lng: 10.139444,
  },
}

const request: UpdateRequest = {
  vehicleId: 1,
  pos: { lat: 54.323334, lng: 10.139444 },
}
