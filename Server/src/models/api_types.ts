
////////////////////////////////////////////////////////////////////////////////
// generic types
////////////////////////////////////////////////////////////////////////////////

export interface Position {
    lat: number
    lng: number
}

////////////////////////////////////////////////////////////////////////////////
// init stuff
////////////////////////////////////////////////////////////////////////////////

// GET /tracks => TrackListEntry[]
// GET /init/{track_id} => InitResponse
// GET /init?foo={InitRequest} => InitResponse
export interface InitResponse {
    trackName: string
    trackPath?: GeoJSON.GeoJSON,
    pointsOfInterest: PointOfInterest[]
}

export interface TrackListEntry {
    id: number,
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
    pos: Position,
    isTurningPoint: boolean
}

////////////////////////////////////////////////////////////////////////////////
// vehicle stuff
////////////////////////////////////////////////////////////////////////////////

export interface Vehicle {
    id: number
    pos: Position
    headingTowardsUser?: boolean
    heading?: number  // between 0 and 360
}

////////////////////////////////////////////////////////////////////////////////
// update vehicle state stuff
////////////////////////////////////////////////////////////////////////////////

export interface UpdateResponse {
    vehicleId?: number // Vehicle id of the user (in case change was detected?)
    vehiclesNearUser: Vehicle[] // Vehicles that should be marked on the map
    distanceTraveled?: number // Usage stat in the top of the app
    distanceToNextCrossing: number
    distanceToNextVehicle: number
    passingPosition?: Position // Only set if needed
}


export interface UpdateRequest {
    vehicleId?: number
    pos?: Position
    speed?: number
    timestamp?: number
    direction?: number
}


////////////////////////////////////////////////////////////////////////////////
// Vehicle_Display_stuff
////////////////////////////////////////////////////////////////////////////////

// GET /vehicle/all => vehicles[]

