import { AxiosRequestConfig } from "axios"
import {
  InitRequestInternalPosition,
  InitResponse,
  TrackListEntry,
} from "../types/init"
import { Backend } from "./backend"
import { UpdateRequest, UpdateResponse } from "../types/update"
import { VehicleNameRequest, VehicleNameResponse } from "../types/vehicle"

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
  trackId: number,
  config?: AxiosRequestConfig
): Promise<InitResponse> => {
  const response = await Backend.get<InitResponse>(
    `/init/app/track/${trackId}`,
    config
  )

  return response.data
}

const retrieveUpdateData = async (
  updateRequest: UpdateRequest,
  config?: AxiosRequestConfig
): Promise<UpdateResponse> => {
  const response = await Backend.put<UpdateResponse>(
    "/vehicles/app/",
    updateRequest,
    config
  )

  return response.data
}

const retrieveVehicleId = async (
  vehicleNameRequest: VehicleNameRequest,
  config?: AxiosRequestConfig
): Promise<VehicleNameResponse> => {
  const response = await Backend.post<VehicleNameResponse>(
    "/vehicles/app/getId",
    vehicleNameRequest,
    config
  )

  return response.data
}

const retrieveTracks = async (
  config?: AxiosRequestConfig
): Promise<TrackListEntry[]> => {
  const response = await Backend.get<TrackListEntry[]>(
    "/init/app/tracks",
    config
  )

  return response.data
}

export const Api = {
  retrieveInitDataWithPosition,
  retrieveInitDataWithTrackId,
  retrieveUpdateData,
  retrieveVehicleId,
  retrieveTracks,
}
