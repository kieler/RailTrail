import { Position } from "./position"

export interface Vehicle {
  id: number
  pos: Position
  headingTowardsUser?: boolean
  heading?: number // between 0 and 360
}
