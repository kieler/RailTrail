import { Position } from "./position"

export interface InitResponse {
  trackName: string
  trackPath?: GeoJSON.GeoJSON
  pointsOfInterest: PointOfInterest[]
}

export interface TrackListEntry {
  id: number
  name: string // human readable name
}

export interface InitRequest {
  pos: Position
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
  name: string
  pos: Position
  isTurningPoint: boolean
}

export interface InitRequest {
  pos: { lat: number; lng: number }
}

// Example
const response: InitResponse = {
  trackName: "Malente-Lütjenburg",
  pointsOfInterest: [
    {
      type: POIType.LevelCrossing,
      name: "",
      pos: { lat: 54.323334, lng: 10.139444 },
      isTurningPoint: false,
    },
  ],
}

const request: InitRequest = {
  pos: { lat: 54.323334, lng: 10.139444 },
}
