import { AxiosRequestConfig } from "axios"
import { InitRequestInternalPosition, InitResponse } from "../types/init"
import { Backend } from "./backend"
import {
  UpdateRequestExternalPosition,
  UpdateRequestInternalPosition,
  UpdateResponseExternalPosition,
  UpdateResponseInternalPosition,
} from "../types/update"

const retrieveInitDataWithPosition = async (
  initRequest: InitRequestInternalPosition,
  config?: AxiosRequestConfig
): Promise<InitResponse> => {
  const response = await Backend.put<InitResponse>(
    "/init/app",
    initRequest,
    config
  )

  return response.data
}

const retrieveInitDataWithTrackId = async (
  trackId: string,
  config?: AxiosRequestConfig
): Promise<InitResponse> => {
  const response = await Backend.get<InitResponse>(
    `/init/app/track/${trackId}`,
    config
  )

  return response.data
}

const retrieveUpdateDataInternalPosition = async (
  updateRequest: UpdateRequestInternalPosition,
  config?: AxiosRequestConfig
): Promise<UpdateResponseInternalPosition> => {
  const response = await Backend.put<UpdateResponseInternalPosition>(
    "/vehicles/app/internalposition",
    updateRequest,
    config
  )

  return response.data
}

const retrieveUpdateDataExternalPosition = async (
  updateRequest: UpdateRequestExternalPosition,
  config?: AxiosRequestConfig
): Promise<UpdateResponseExternalPosition> => {
  const response = await Backend.put<UpdateResponseExternalPosition>(
    "/vehicles/app/externalposition",
    updateRequest,
    config
  )

  return response.data
}

export const Api = {
  retrieveInitDataWithPosition,
  retrieveInitDataWithTrackId,
  retrieveUpdateDataInternalPosition,
  retrieveUpdateDataExternalPosition,
}
