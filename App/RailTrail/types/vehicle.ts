import { Position } from "./position"

export interface Vehicle {
  id: number
  pos: Position
  percentagePosition: number
  headingTowardsUser?: boolean
}
