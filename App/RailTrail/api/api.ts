import { AxiosRequestConfig } from "axios"
import { InitRequest, InitResponse } from "../types/init"
import { Backend } from "./backend"
import { UpdateRequest, UpdateResponse } from "../types/update"

const retrieveInitData = async (
  initRequest: InitRequest,
  config?: AxiosRequestConfig
): Promise<InitResponse> => {
  const response = await Backend.put<InitResponse>("/init", {
    data: JSON.stringify(initRequest),
    params: config,
  })

  return response.data
}

const retrieveUpdateData = async (
  updateRequest: UpdateRequest,
  config?: AxiosRequestConfig
): Promise<UpdateResponse> => {
  const response = await Backend.put<UpdateResponse>("/vehicles", {
    data: JSON.stringify(updateRequest),
    params: config,
  })

  return response.data
}

export const Api = {
  retrieveInitData,
  retrieveUpdateData,
}
