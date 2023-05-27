import { AxiosRequestConfig } from "axios"
import { InitRequest, InitResponse } from "../types/init"
import { Backend } from "./backend"

const retrieveInitData = async (
  initRequest: InitRequest,
  config?: AxiosRequestConfig
): Promise<InitResponse> => {
  const response = await Backend.get<InitResponse>("/init", {
    data: initRequest,
    params: config,
  })

  return response.data
}

export const Api = {
  retrieveInitData,
}
