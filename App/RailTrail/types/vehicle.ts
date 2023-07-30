import { Position } from "./position"

export interface Vehicle {
  id: number
  pos: Position
  percentagePosition: number
  headingTowardsUser?: boolean
  heading?: number
}

export interface VehicleNameRequest {
  vehicleName: string
  trackId: number
}

export interface VehicleNameResponse {
  vehicleId: number
}
