import { AxiosRequestConfig } from "axios"
import { Api } from "../api/api"
import { RailTrailError, isRailTrailError } from "../types/railtrail-error"
import { InitRequest, InitResponse } from "../types/init"
import { UpdateRequest, UpdateResponse } from "../types/update"

export const handleError = (
  error: any,
  fallbackError?: RailTrailError
): RailTrailError =>
  isRailTrailError(error)
    ? error
    : fallbackError ?? RailTrailError.unknownError(error?.message)

export const retrieveInitData = (
  initRequest: InitRequest,
  config?: AxiosRequestConfig
) =>
  Api.retrieveInitData(initRequest, config)
    .then((data) => {
      return data as InitResponse
    })
    .catch((error) => {
      throw handleRetrieveInitDataError(error)
    })

const handleRetrieveInitDataError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.noInitData())

export const retrieveUpdateData = (
  updateRequest: UpdateRequest,
  config?: AxiosRequestConfig
) =>
  Api.retrieveUpdateData(updateRequest, config)
    .then((data) => {
      return data as UpdateResponse
    })
    .catch((error) => {
      throw handleRetrieveUpdateDataError(error)
    })

const handleRetrieveUpdateDataError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.noUpdateData())
