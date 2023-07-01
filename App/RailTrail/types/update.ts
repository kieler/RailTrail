import { Position } from "./position"
import { Vehicle } from "./vehicle"

export interface UpdateRequestInternalPosition {
  vehicleId: number
  pos: Position
}

export interface UpdateResponseInternalPosition {
  vehiclesNearUser: Vehicle[]
  percentagePositionOnTrack: number
  passingPosition?: Position
}

export interface UpdateRequestExternalPosition {
  vehicleId: number
}

export interface UpdateResponseExternalPosition {
  pos: Position // The current position as measured by vehicle
  heading: number // Heading of the vehicle between 0 and 359
  vehiclesNearUser: Vehicle[] // Vehicles that should be marked on the map
  percentagePositionOnTrack: number // Percentage (0-100) e.g. 0% Malente; 100% Lütjenburg
}

// // Examples
// const response: UpdateResponse = {
//   vehiclesNearUser: [
//     {
//       id: 1,
//       pos: { lat: 54.323334, lng: 10.139444 },
//       percentagePosition: 43,
//       headingTowardsUser: true,
//     },
//   ],
//   percentagePositionOnTrack: 43,
//   passingPosition: {
//     lat: 54.323334,
//     lng: 10.139444,
//   },
// }

// const request: UpdateRequest = {
//   vehicleId: 1,
//   pos: { lat: 54.323334, lng: 10.139444 },
// }
