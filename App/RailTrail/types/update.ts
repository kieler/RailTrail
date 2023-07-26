import { Position } from "./position"
import { Vehicle } from "./vehicle"

export interface UpdateRequest {
  vehicleId: number
  pos?: Position
  speed?: number
  heading?: number
}

export interface UpdateResponse {
  pos: Position
  speed: number
  heading: number // Heading of the vehicle between 0 and 359
  vehiclesNearUser: Vehicle[] // Vehicles that should be marked on the map
  percentagePositionOnTrack: number // Percentage (0-100) e.g. 0% Malente; 100% Lütjenburg
  passingPosition?: Position
}
