import { AxiosRequestConfig } from "axios"
import { Api } from "../api/api"
import { RailTrailError, isRailTrailError } from "../types/railtrail-error"
import { InitRequest } from "../types/init"

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
      console.log(data)
      return data
    })
    .catch((error) => {
      throw handleRetrieveInitDataError(error)
    })

const handleRetrieveInitDataError = (error: any): RailTrailError =>
  handleError(error, RailTrailError.noInitData())
