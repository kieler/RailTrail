import { PointOfInterest } from "../types/init"
import { RailTrailReduxAction } from "./action"
import * as Location from "expo-location"

export interface AppState {
  readonly trackId: number | null
  readonly hasLocationPermission: boolean
  readonly isTripStarted: boolean
  readonly location: Location.LocationObject | null
  readonly pointsOfInterest: PointOfInterest[]
}

interface AppActionSetTrackId {
  readonly type: "app/set-track-id"
  readonly payload: number | null
}

interface AppActionSetHasLocationPermission {
  readonly type: "app/set-has-location-permission"
  readonly payload: boolean
}

interface AppActionSetIsTripStarted {
  readonly type: "app/set-is-trip-started"
  readonly payload: boolean
}

interface AppActionSetLocation {
  readonly type: "app/set-location"
  readonly payload: Location.LocationObject | null
}

interface AppActionSetPointsOfInterest {
  readonly type: "app/set-points-of-interest"
  readonly payload: PointOfInterest[]
}

export type AppAction =
  | AppActionSetHasLocationPermission
  | AppActionSetTrackId
  | AppActionSetIsTripStarted
  | AppActionSetLocation
  | AppActionSetPointsOfInterest

export const AppAction = {
  setTrackId: (trackId: number | null): AppActionSetTrackId => ({
    type: "app/set-track-id",
    payload: trackId,
  }),
  setHasLocationPermission: (
    hasLocationPermission: boolean
  ): AppActionSetHasLocationPermission => ({
    type: "app/set-has-location-permission",
    payload: hasLocationPermission,
  }),
  setIsTripStarted: (isTripStarted: boolean): AppActionSetIsTripStarted => ({
    type: "app/set-is-trip-started",
    payload: isTripStarted,
  }),
  setLocation: (
    location: Location.LocationObject | null
  ): AppActionSetLocation => ({
    type: "app/set-location",
    payload: location,
  }),
  setPointsOfInterest: (
    pointsOfInterest: PointOfInterest[]
  ): AppActionSetPointsOfInterest => ({
    type: "app/set-points-of-interest",
    payload: pointsOfInterest,
  }),
}

export const initialAppState: AppState = {
  trackId: null,
  hasLocationPermission: false,
  isTripStarted: false,
  location: null,
  pointsOfInterest: [],
}

const reducer = (
  state = initialAppState,
  action: RailTrailReduxAction
): AppState => {
  switch (action.type) {
    case "app/set-track-id":
      return { ...state, trackId: action.payload }
    case "app/set-has-location-permission":
      return { ...state, hasLocationPermission: action.payload }
    case "app/set-is-trip-started":
      return { ...state, isTripStarted: action.payload }
    case "app/set-location":
      return { ...state, location: action.payload }
    case "app/set-points-of-interest":
      return { ...state, pointsOfInterest: action.payload }
    default:
      return state
  }
}

export default reducer
