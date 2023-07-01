import { AxiosRequestConfig } from "axios"
import { Api } from "../api/api"
import { RailTrailError, isRailTrailError } from "../types/railtrail-error"
import { InitRequestInternalPosition, InitResponse } from "../types/init"
import { getCurrentLocation } from "./location"
import * as Location from "expo-location"
import {
  UpdateRequestExternalPosition,
  UpdateRequestInternalPosition,
  UpdateResponseExternalPosition,
  UpdateResponseInternalPosition,
} from "../types/update"

export const handleError = (
  error: any,
  fallbackError?: RailTrailError
): RailTrailError =>
  isRailTrailError(error)
    ? error
    : fallbackError ?? RailTrailError.unknownError(error?.message)

export const retrieveInitDataWithPosition = async (
  initCallback: (initResponse: InitResponse) => {},
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
      initCallback(data as InitResponse)
    })
    .catch((error) => {
      throw handleRetrieveInitDataError(error)
    })
}

export const retrieveInitDataWithTrackId = async (
  trackId: string,
  initCallback: (initResponse: InitResponse) => {},
  config?: AxiosRequestConfig
) => {
  return Api.retrieveInitDataWithTrackId(trackId, config)
    .then((data) => {
      initCallback(data as InitResponse)
    })
    .catch((error) => {
      throw handleRetrieveInitDataError(error)
    })
}

const handleRetrieveInitDataError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.noInitData())

export const retrieveUpdateDataInternalPosition = (
  updateCallback: (updateResponse: UpdateResponseInternalPosition) => {},
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
      updateCallback(data as UpdateResponseInternalPosition)
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

const handleRetrieveUpdateDataError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.noUpdateData())
