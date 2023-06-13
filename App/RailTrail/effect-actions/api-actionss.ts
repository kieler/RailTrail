import { AxiosRequestConfig } from "axios"
import { Api } from "../api/api"
import { RailTrailError, isRailTrailError } from "../types/railtrail-error"
import { InitRequest, InitResponse } from "../types/init"
import { UpdateRequest, UpdateResponse } from "../types/update"
import { getCurrentLocation } from "./location"
import * as Location from "expo-location"

export const handleError = (
  error: any,
  fallbackError?: RailTrailError
): RailTrailError =>
  isRailTrailError(error)
    ? error
    : fallbackError ?? RailTrailError.unknownError(error?.message)

export const retrieveInitData = async (
  permissionsGranted: boolean,
  initCallback: (initResponse: InitResponse) => {},
  config?: AxiosRequestConfig
) => {
  let initRequest: InitRequest
  if (permissionsGranted) {
    const location = await getCurrentLocation()
    initRequest = {
      pos: {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      },
    }
  } else {
    initRequest = {}
  }

  return Api.retrieveInitData(initRequest, config)
    .then((data) => {
      initCallback(data as InitResponse)
    })
    .catch((error) => {
      throw handleRetrieveInitDataError(error)
    })
}

const handleRetrieveInitDataError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.noInitData())

export const retrieveUpdateData = (
  updateCallback: (updateResponse: UpdateResponse) => {},
  location: Location.LocationObject,
  vehicleId: number,
  config?: AxiosRequestConfig
) => {
  const updateRequest: UpdateRequest = {
    vehicleId: vehicleId,
    pos: { lat: location.coords.latitude, lng: location.coords.longitude },
  }

  Api.retrieveUpdateData(updateRequest, config)
    .then((data) => {
      updateCallback(data as UpdateResponse)
    })
    .catch((error) => {
      throw handleRetrieveUpdateDataError(error)
    })
}

const handleRetrieveUpdateDataError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.noUpdateData())
