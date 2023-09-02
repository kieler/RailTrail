import { Position } from "./position"

export interface InitRequestInternalPosition {
  pos: Position
}

export interface InitRequestTrackId {
  pos: Position
}

export interface InitResponse {
  trackId: number
  trackName: string
  trackPath: GeoJSON.FeatureCollection
  trackLength: number
  pointsOfInterest: PointOfInterest[]
}

export interface TrackListEntry {
  id: number
  name: string // human readable name
}

export enum POIType {
  Generic = 0,
  LevelCrossing = 1,
  LesserLevelCrossing = 2,
  Picnic = 3,
  TrackEnd = 4,
  TurningPoint = 5,
}

export interface PointOfInterest {
  typeId: POIType
  name?: string
  pos: Position
  percentagePosition: number
  isTurningPoint: boolean
}

// // Example
// const response: InitResponse = {
//   trackId: 1,
//   trackName: "Malente-Lütjenburg",
//   trackLength: 17000,
//   pointsOfInterest: [
//     {
//       type: POIType.LevelCrossing,
//       name: "",
//       pos: { lat: 54.323334, lng: 10.139444 },
//       percentagePosition: 34,
//       isTurningPoint: false,
//     },
//   ],
// }

// export const request: InitRequest = {
//   pos: { lat: 54.323334, lng: 10.139444 },
// }
