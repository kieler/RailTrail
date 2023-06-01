import { Position } from "./position"

export interface InitResponse {
  trackName: string
  trackStart: string
  trackEnd: string
  trackPath?: GeoJSON.GeoJSON
  pointsOfInterest: PointOfInterest[]
}

export interface TrackListEntry {
  id: number
  name: string // human readable name
}

export interface InitRequest {
  pos?: Position
}

export enum POIType {
  None,
  LevelCrossing,
  LesserLevelCrossing,
  LeastLevelCrossing,
  Stops,
  TrackEnd,
  //...
}

export interface PointOfInterest {
  type: POIType
  name?: string
  pos: Position
  isTurningPoint: boolean
}

// Example
const response: InitResponse = {
  trackName: "Malente-Lütjenburg",
  trackStart: "Bhf Malente",
  trackEnd: "Bhf Lütjenburg",
  pointsOfInterest: [
    {
      type: POIType.LevelCrossing,
      name: "",
      pos: { lat: 54.323334, lng: 10.139444 },
      isTurningPoint: false,
    },
  ],
}

export const request: InitRequest = {
  pos: { lat: 54.323334, lng: 10.139444 },
}
