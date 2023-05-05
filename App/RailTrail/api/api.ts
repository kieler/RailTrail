import { AxiosRequestConfig } from "axios"
import { InitResponse } from "../types/init"
import { Backend } from "./backend"

const retrieveInitData = async (
  config?: AxiosRequestConfig
): Promise<InitResponse> => {
  const response = await Backend.get<InitResponse>("init", config)

  return response.data
}

export const Api = {
  retrieveInitData,
}
