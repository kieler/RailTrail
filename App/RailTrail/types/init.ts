import { Position } from "./position"

export interface InitResponse {
  trackId: number
  trackName: string
  trackPath?: GeoJSON.GeoJSON
  trackLength: number
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
  Picnic,
  TrackEnd,
}

export interface PointOfInterest {
  type: POIType
  name?: string
  pos: Position
  percentagePosition: number
  isTurningPoint: boolean
}

// Example
const response: InitResponse = {
  trackId: 1,
  trackName: "Malente-Lütjenburg",
  trackLength: 17000,
  pointsOfInterest: [
    {
      type: POIType.LevelCrossing,
      name: "",
      pos: { lat: 54.323334, lng: 10.139444 },
      percentagePosition: 34,
      isTurningPoint: false,
    },
  ],
}

export const request: InitRequest = {
  pos: { lat: 54.323334, lng: 10.139444 },
}
