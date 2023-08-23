import { Position } from "../types/position"
import { Vehicle } from "../types/vehicle"
import { RailTrailReduxAction } from "./action"

export interface TripState {
  readonly vehicleId: number | null
  readonly vehicleName: string | null
  readonly distanceTravelled: number
  readonly speed: number
  readonly heading: number
  readonly nextVehicleDistance: number | null
  readonly nextVehicleHeadingTowardsUserDistance: number | null
  readonly nextLevelCrossingDistance: number | null
  readonly vehicles: Vehicle[]
  readonly percentagePositionOnTrack: number | null
  readonly calculatedPosition: Position | null
  readonly passingPositon: Position | null
}

interface TripActionReset {
  readonly type: "trip/reset"
}

interface TripActionSetVehicleId {
  readonly type: "trip/set-vehicle-id"
  readonly payload: number | null
}

interface TripActionSetVehicleName {
  readonly type: "trip/set-vehicle-name"
  readonly payload: string | null
}

interface TripActionSetDistanceTravelled {
  readonly type: "trip/set-distance-travelled"
  readonly payload: number
}

interface TripActionAddToDistanceTravelled {
  readonly type: "trip/add-to-distance-travelled"
  readonly payload: number
}

interface TripActionSetSpeed {
  readonly type: "trip/set-speed"
  readonly payload: number
}

interface TripActionSetHeading {
  readonly type: "trip/set-heading"
  readonly payload: number
}

interface TripActionSetNextVehicleDistance {
  readonly type: "trip/set-next-vehicle-distance"
  readonly payload: number | null
}

interface TripActionSetNextVehicleHeadingTowardsUserDistance {
  readonly type: "trip/set-next-vehicle-heading-towars-user-distance"
  readonly payload: number | null
}

interface TripActionSetNextLevelCrossingDistance {
  readonly type: "trip/set-next-level-crossing-distance"
  readonly payload: number | null
}

interface TripActionSetVehicles {
  readonly type: "trip/set-vehicles"
  readonly payload: Vehicle[]
}

interface TripActionSetPercentagePositionOnTrack {
  readonly type: "trip/set-percentage-position-on-track"
  readonly payload: number | null
}

interface TripActionSetCalculatedPosition {
  readonly type: "trip/set-calculated-position"
  readonly payload: Position | null
}

interface TripActionSetPassingPosition {
  readonly type: "trip/set-passing-position"
  readonly payload: Position | null
}

export type TripAction =
  | TripActionReset
  | TripActionSetVehicleId
  | TripActionSetVehicleName
  | TripActionSetDistanceTravelled
  | TripActionAddToDistanceTravelled
  | TripActionSetSpeed
  | TripActionSetHeading
  | TripActionSetNextVehicleDistance
  | TripActionSetNextVehicleHeadingTowardsUserDistance
  | TripActionSetNextLevelCrossingDistance
  | TripActionSetVehicles
  | TripActionSetPercentagePositionOnTrack
  | TripActionSetCalculatedPosition
  | TripActionSetPassingPosition

export const TripAction = {
  reset: (): TripActionReset => ({
    type: "trip/reset",
  }),
  setVehicleId: (vehicleId: number | null): TripActionSetVehicleId => ({
    type: "trip/set-vehicle-id",
    payload: vehicleId,
  }),
  setVehicleName: (vehicleName: string | null): TripActionSetVehicleName => ({
    type: "trip/set-vehicle-name",
    payload: vehicleName,
  }),
  setDistanceTravelled: (
    distanceTravelled: number
  ): TripActionSetDistanceTravelled => ({
    type: "trip/set-distance-travelled",
    payload: distanceTravelled,
  }),
  addToDistanceTravelled: (
    distanceTravelled: number
  ): TripActionAddToDistanceTravelled => ({
    type: "trip/add-to-distance-travelled",
    payload: distanceTravelled,
  }),
  setSpeed: (speed: number): TripActionSetSpeed => ({
    type: "trip/set-speed",
    payload: speed,
  }),
  setHeading: (heading: number): TripActionSetHeading => ({
    type: "trip/set-heading",
    payload: heading,
  }),
  setNextVehicleDistance: (
    nextVehicleDistance: number | null
  ): TripActionSetNextVehicleDistance => ({
    type: "trip/set-next-vehicle-distance",
    payload: nextVehicleDistance,
  }),
  setNextVehicleHeadingTowardsUserDistance: (
    nextVehicleHeadingTowardsUserDistance: number | null
  ): TripActionSetNextVehicleHeadingTowardsUserDistance => ({
    type: "trip/set-next-vehicle-heading-towars-user-distance",
    payload: nextVehicleHeadingTowardsUserDistance,
  }),
  setNextLevelCrossingDistance: (
    nextLevelCrossingDistance: number | null
  ): TripActionSetNextLevelCrossingDistance => ({
    type: "trip/set-next-level-crossing-distance",
    payload: nextLevelCrossingDistance,
  }),
  setVehicles: (vehicles: Vehicle[]): TripActionSetVehicles => ({
    type: "trip/set-vehicles",
    payload: vehicles,
  }),
  setPercentagePositionOnTrack: (
    percentagePositionOnTrack: number | null
  ): TripActionSetPercentagePositionOnTrack => ({
    type: "trip/set-percentage-position-on-track",
    payload: percentagePositionOnTrack,
  }),
  setCalculatedPosition: (
    calculatedPosition: Position | null
  ): TripActionSetCalculatedPosition => ({
    type: "trip/set-calculated-position",
    payload: calculatedPosition,
  }),
  setPassingPosition: (
    passingPosition: Position | null
  ): TripActionSetPassingPosition => ({
    type: "trip/set-passing-position",
    payload: passingPosition,
  }),
}

export const initialTripState: TripState = {
  vehicleId: null,
  vehicleName: null,
  distanceTravelled: 0,
  speed: 0,
  heading: 0,
  nextVehicleDistance: null,
  nextVehicleHeadingTowardsUserDistance: null,
  nextLevelCrossingDistance: null,
  vehicles: [],
  percentagePositionOnTrack: null,
  calculatedPosition: null,
  passingPositon: null,
}

const reducer = (
  state = initialTripState,
  action: RailTrailReduxAction
): TripState => {
  switch (action.type) {
    case "trip/reset":
      return { ...initialTripState }
    case "trip/set-vehicle-id":
      return { ...state, vehicleId: action.payload }
    case "trip/set-vehicle-name":
      return { ...state, vehicleName: action.payload }
    case "trip/set-distance-travelled":
      return { ...state, distanceTravelled: action.payload }
    case "trip/add-to-distance-travelled":
      return {
        ...state,
        distanceTravelled: state.distanceTravelled + action.payload,
      }
    case "trip/set-speed":
      return { ...state, speed: action.payload }
    case "trip/set-heading":
      return { ...state, heading: action.payload }
    case "trip/set-next-vehicle-distance":
      return { ...state, nextVehicleDistance: action.payload }
    case "trip/set-next-vehicle-heading-towars-user-distance":
      return { ...state, nextVehicleHeadingTowardsUserDistance: action.payload }
    case "trip/set-next-level-crossing-distance":
      return { ...state, nextLevelCrossingDistance: action.payload }
    case "trip/set-vehicles":
      return { ...state, vehicles: action.payload }
    case "trip/set-percentage-position-on-track":
      return { ...state, percentagePositionOnTrack: action.payload }
    case "trip/set-calculated-position":
      return { ...state, calculatedPosition: action.payload }
    case "trip/set-passing-position":
      return { ...state, passingPositon: action.payload }
    default:
      return state
  }
}

export default reducer
