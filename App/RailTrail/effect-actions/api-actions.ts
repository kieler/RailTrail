import { AxiosRequestConfig } from "axios"
import { Api } from "../api/api"
import { RailTrailError, isRailTrailError } from "../types/railtrail-error"
import { InitRequestInternalPosition, TrackListEntry } from "../types/init"
import { getCurrentLocation } from "./location"
import * as Location from "expo-location"
import { UpdateRequest } from "../types/update"
import { VehicleNameRequest, VehicleNameResponse } from "../types/vehicle"
import { Dispatch } from "redux"
import { AppAction } from "../redux/app"
import { TripAction } from "../redux/trip"

export const handleError = (
  error: any,
  fallbackError?: RailTrailError
): RailTrailError =>
  isRailTrailError(error)
    ? error
    : fallbackError ?? RailTrailError.unknownError(error?.message)

export const retrieveInitDataWithPosition = async (
  dispatch: Dispatch,
  config?: AxiosRequestConfig
) => {
  let initRequest: InitRequestInternalPosition
  const location = await getCurrentLocation()
  initRequest = {
    pos: {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    },
  }

  Api.retrieveInitDataWithPosition(initRequest, config)
    .then((data) => {
      dispatch(AppAction.setPointsOfInterest(data.pointsOfInterest))
      dispatch(AppAction.setTrackId(data.trackId))
      dispatch(AppAction.setTrackLength(data.trackLength * 1000)) // Convert to meter
      dispatch(AppAction.setTrackPath(data.trackPath))
    })
    .catch((error) => {
      throw handleRetrieveInitDataError(error)
    })
}

export const retrieveInitDataWithTrackId = async (
  trackId: number,
  dispatch: Dispatch,
  config?: AxiosRequestConfig
) => {
  Api.retrieveInitDataWithTrackId(trackId, config)
    .then((data) => {
      dispatch(AppAction.setPointsOfInterest(data.pointsOfInterest))
      dispatch(AppAction.setTrackId(data.trackId))
      dispatch(AppAction.setTrackLength(data.trackLength * 1000)) // Convert to meter
      dispatch(AppAction.setTrackPath(data.trackPath))
    })
    .catch((error) => {
      throw handleRetrieveInitDataError(error)
    })
}

const handleRetrieveInitDataError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.noInitData())

export const retrieveUpdateData = (
  dispatch: Dispatch,
  vehicleId: number,
  location?: Location.LocationObject,
  config?: AxiosRequestConfig
) => {
  var updateRequest: UpdateRequest
  if (location) {
    updateRequest = {
      vehicleId: vehicleId,
      pos: { lat: location.coords.latitude, lng: location.coords.longitude },
      speed: location.coords.speed ? location.coords.speed * 3.6 : undefined,
      heading: location.coords.heading ?? undefined,
      timestamp: location.timestamp,
    }
  } else {
    updateRequest = {
      vehicleId: vehicleId,
    }
  }

  // Mock
  // if (lastCalculatedPosition) {
  //   const d = calculateDistanceFromCoordinates(
  //     lastCalculatedPosition.lat,
  //     lastCalculatedPosition.lng,
  //     location!.coords.latitude,
  //     location!.coords.longitude
  //   )
  //   console.log(d)

  //   dispatch(TripAction.addToDistanceTravelled(d))
  // }
  // if (location) {
  //   const p = {
  //     lat: location.coords.latitude,
  //     lng: location.coords.longitude,
  //   }
  //   dispatch(TripAction.setCalculatedPosition(p)) //data.pos))
  // }

  Api.retrieveUpdateData(updateRequest, config)
    .then((data) => {
      dispatch(TripAction.setCalculatedPosition(data.pos))
      dispatch(
        TripAction.setPercentagePositionOnTrack(data.percentagePositionOnTrack)
      )
      dispatch(TripAction.setVehicles(data.vehiclesNearUser))
      dispatch(TripAction.setSpeed(data.speed))
      dispatch(TripAction.setHeading(data.heading))
      dispatch(TripAction.setPassingPosition(data.passingPosition ?? null))
    })
    .catch((error) => {
      throw handleRetrieveUpdateDataError(error)
    })
}

const handleRetrieveUpdateDataError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.noUpdateData())

export const retrieveVehicleId = async (
  vehicleName: string,
  trackId: number,
  config?: AxiosRequestConfig
) => {
  const vehicleNameRequest: VehicleNameRequest = {
    vehicleName: vehicleName,
    trackId: trackId,
  }

  return Api.retrieveVehicleId(vehicleNameRequest, config)
    .then((data) => {
      return (data as VehicleNameResponse).vehicleId
    })
    .catch((error) => {
      if (error.response.status == 404) return null
      throw handleRetrieveVehicleIdError(error)
    })
}

const handleRetrieveVehicleIdError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.unknownError())

export const retrieveTracks = async (
  setTracksCallback: React.Dispatch<React.SetStateAction<TrackListEntry[]>>,
  config?: AxiosRequestConfig
) => {
  Api.retrieveTracks(config)
    .then((data) => {
      setTracksCallback(data as TrackListEntry[])
    })
    .catch((error) => {
      if (error.response.status == 500) return null
      throw handleRetrieveTrakcsError(error)
    })
}

const handleRetrieveTrakcsError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.unknownError())
