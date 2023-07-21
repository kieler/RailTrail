import { Vehicle } from "../types/vehicle"
import { RailTrailReduxAction } from "./action"

export interface TripState {
  readonly vehicleId: number | null
  readonly distanceTravelled: number
  readonly speed: number
  readonly nextVehicleDistance: number | null
  readonly nextLevelCrossingDistance: number | null
  readonly vehicles: Vehicle[]
  readonly percentagePositionOnTrack: number | null
}

interface TripActionSetVehicleId {
  readonly type: "trip/set-vehicle-id"
  readonly payload: number | null
}

interface TripActionSetDistanceTravelled {
  readonly type: "trip/set-distance-travelled"
  readonly payload: number
}

interface TripActionSetSpeed {
  readonly type: "trip/set-speed"
  readonly payload: number
}

interface TripActionSetNextVehicleDistance {
  readonly type: "trip/set-next-vehicle-distance"
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

export type TripAction =
  | TripActionSetVehicleId
  | TripActionSetDistanceTravelled
  | TripActionSetSpeed
  | TripActionSetNextVehicleDistance
  | TripActionSetNextLevelCrossingDistance
  | TripActionSetVehicles
  | TripActionSetPercentagePositionOnTrack

export const TripAction = {
  setVehicleId: (vehicleId: number | null): TripActionSetVehicleId => ({
    type: "trip/set-vehicle-id",
    payload: vehicleId,
  }),
  setDistanceTravelled: (
    distanceTravelled: number
  ): TripActionSetDistanceTravelled => ({
    type: "trip/set-distance-travelled",
    payload: distanceTravelled,
  }),
  setSpeed: (speed: number): TripActionSetSpeed => ({
    type: "trip/set-speed",
    payload: speed,
  }),
  setNextVehicleDistance: (
    nextVehicleDistance: number | null
  ): TripActionSetNextVehicleDistance => ({
    type: "trip/set-next-vehicle-distance",
    payload: nextVehicleDistance,
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
}

export const initialTripState: TripState = {
  vehicleId: null,
  distanceTravelled: 0,
  speed: 0,
  nextVehicleDistance: null,
  nextLevelCrossingDistance: null,
  vehicles: [],
  percentagePositionOnTrack: null,
}

const reducer = (
  state = initialTripState,
  action: RailTrailReduxAction
): TripState => {
  switch (action.type) {
    case "trip/set-vehicle-id":
      return { ...state, vehicleId: action.payload }
    case "trip/set-distance-travelled":
      return { ...state, distanceTravelled: action.payload }
    case "trip/set-speed":
      return { ...state, speed: action.payload }
    case "trip/set-next-vehicle-distance":
      return { ...state, nextVehicleDistance: action.payload }
    case "trip/set-next-level-crossing-distance":
      return { ...state, nextLevelCrossingDistance: action.payload }
    case "trip/set-vehicles":
      return { ...state, vehicles: action.payload }
    case "trip/set-percentage-position-on-track":
      return { ...state, percentagePositionOnTrack: action.payload }
    default:
      return state
  }
}

export default reducer
