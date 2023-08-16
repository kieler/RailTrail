import { PointOfInterest } from "../types/init"
import { RailTrailReduxAction } from "./action"
import * as Location from "expo-location"

export interface AppState {
  readonly trackId: number | null
  readonly hasForegroundLocationPermission: boolean
  readonly hasBackgroundLocationPermission: boolean
  readonly isTripStarted: boolean
  readonly location: Location.LocationObject | null
  readonly pointsOfInterest: PointOfInterest[]
  readonly foregroundLocationSubscription: Location.LocationSubscription | null
}

interface AppActionSetTrackId {
  readonly type: "app/set-track-id"
  readonly payload: number | null
}

interface AppActionSetHasForegroundLocationPermission {
  readonly type: "app/set-has-foreground-location-permission"
  readonly payload: boolean
}

interface AppActionSetHasBackgroundLocationPermission {
  readonly type: "app/set-has-background-location-permission"
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

interface AppActionSetForegroundLocationSubscription {
  readonly type: "app/set-foreground-location-subscription"
  readonly payload: Location.LocationSubscription | null
}

export type AppAction =
  | AppActionSetHasForegroundLocationPermission
  | AppActionSetHasBackgroundLocationPermission
  | AppActionSetTrackId
  | AppActionSetIsTripStarted
  | AppActionSetLocation
  | AppActionSetPointsOfInterest
  | AppActionSetForegroundLocationSubscription

export const AppAction = {
  setTrackId: (trackId: number | null): AppActionSetTrackId => ({
    type: "app/set-track-id",
    payload: trackId,
  }),
  setHasForegroundLocationPermission: (
    hasForegroundLocationPermission: boolean
  ): AppActionSetHasForegroundLocationPermission => ({
    type: "app/set-has-foreground-location-permission",
    payload: hasForegroundLocationPermission,
  }),
  setHasBackgroundLocationPermission: (
    hasBackgroundLocationPermission: boolean
  ): AppActionSetHasBackgroundLocationPermission => ({
    type: "app/set-has-background-location-permission",
    payload: hasBackgroundLocationPermission,
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
  setForegroundLocationSubscription: (
    foregroundLocationSubscription: Location.LocationSubscription | null
  ): AppActionSetForegroundLocationSubscription => ({
    type: "app/set-foreground-location-subscription",
    payload: foregroundLocationSubscription,
  }),
}

export const initialAppState: AppState = {
  trackId: null,
  hasForegroundLocationPermission: false,
  hasBackgroundLocationPermission: false,
  isTripStarted: false,
  location: null,
  pointsOfInterest: [],
  foregroundLocationSubscription: null,
}

const reducer = (
  state = initialAppState,
  action: RailTrailReduxAction
): AppState => {
  switch (action.type) {
    case "app/set-track-id":
      return { ...state, trackId: action.payload }
    case "app/set-has-foreground-location-permission":
      return { ...state, hasForegroundLocationPermission: action.payload }
    case "app/set-has-background-location-permission":
      return { ...state, hasBackgroundLocationPermission: action.payload }
    case "app/set-is-trip-started":
      return { ...state, isTripStarted: action.payload }
    case "app/set-location":
      return { ...state, location: action.payload }
    case "app/set-points-of-interest":
      return { ...state, pointsOfInterest: action.payload }
    case "app/set-foreground-location-subscription":
      return { ...state, foregroundLocationSubscription: action.payload }
    default:
      return state
  }
}

export default reducer
