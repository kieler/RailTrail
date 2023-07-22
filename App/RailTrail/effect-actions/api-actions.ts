import { AxiosRequestConfig } from "axios"
import { Api } from "../api/api"
import { RailTrailError, isRailTrailError } from "../types/railtrail-error"
import {
  InitRequestInternalPosition,
  InitResponse,
  TrackListEntry,
} from "../types/init"
import { getCurrentLocation } from "./location"
import * as Location from "expo-location"
import {
  UpdateRequestExternalPosition,
  UpdateRequestInternalPosition,
  UpdateResponseExternalPosition,
  UpdateResponseInternalPosition,
} from "../types/update"
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

  return Api.retrieveInitDataWithPosition(initRequest, config)
    .then((data) => {
      dispatch(AppAction.setPointsOfInterest(data.pointsOfInterest))
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
  return Api.retrieveInitDataWithTrackId(trackId, config)
    .then((data) => {
      dispatch(AppAction.setPointsOfInterest(data.pointsOfInterest))
    })
    .catch((error) => {
      throw handleRetrieveInitDataError(error)
    })
}

const handleRetrieveInitDataError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.noInitData())

export const retrieveUpdateDataInternalPosition = (
  dispatch: Dispatch,
  location: Location.LocationObject,
  vehicleId: number,
  config?: AxiosRequestConfig
) => {
  const updateRequest: UpdateRequestInternalPosition = {
    vehicleId: vehicleId,
    pos: { lat: location.coords.latitude, lng: location.coords.longitude },
  }

  Api.retrieveUpdateDataInternalPosition(updateRequest, config)
    .then((data) => {
      dispatch(
        TripAction.setPercentagePositionOnTrack(data.percentagePositionOnTrack)
      )
      if (data.vehiclesNearUser)
        dispatch(TripAction.setVehicles(data.vehiclesNearUser))
    })
    .catch((error) => {
      throw handleRetrieveUpdateDataError(error)
    })
}

export const retrieveUpdateDataExternalPosition = (
  updateCallback: (updateResponse: UpdateResponseExternalPosition) => {},
  vehicleId: number,
  config?: AxiosRequestConfig
) => {
  const updateRequest: UpdateRequestExternalPosition = {
    vehicleId: vehicleId,
  }

  Api.retrieveUpdateDataExternalPosition(updateRequest, config)
    .then((data) => {
      updateCallback(data as UpdateResponseExternalPosition)
    })
    .catch((error) => {
      throw handleRetrieveUpdateDataError(error)
    })
}

export const retrieveVehicleId = async (
  vehicleName: string,
  trackId: number,
  config?: AxiosRequestConfig
) => {
  const vehicleNameRequest: VehicleNameRequest = {
    vehicleName: vehicleName,
    trackId: trackId,
  }

  Api.retrieveVehicleId(vehicleNameRequest, config)
    .then((data) => {
      return (data as VehicleNameResponse).vehicleId
    })
    .catch((error) => {
      if (error.response.status == 500) return null
      throw handleRetrieveUpdateDataError(error)
    })
}

export const retrieveTracks = async (
  setTracksCallback: React.Dispatch<React.SetStateAction<TrackListEntry[]>>,
  config?: AxiosRequestConfig
) => {
  Api.retrieveTracks(config).then((data) => {
    setTracksCallback(data as TrackListEntry[])
  })
}

const handleRetrieveUpdateDataError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.noUpdateData())
