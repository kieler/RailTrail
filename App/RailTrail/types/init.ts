export interface InitResponse {
  pointsOfInterest: PointOfInterest[]
}

export interface PointOfInterest {
  type: string
  lat: number
  lng: number
}

// Example
const response: InitResponse = {
  pointsOfInterest: [
    {
      type: "LEVEL_CROSSING",
      lat: 54.323334,
      lng: 10.139444,
    },
  ],
}
