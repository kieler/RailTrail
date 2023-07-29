import axios from "axios"
import { backendUrl, BACKEND_TIMEOUT } from "../util/consts"

export const defaultRequestHeaders = {}

export const Backend = axios.create({
  baseURL: backendUrl,
  timeout: BACKEND_TIMEOUT,
  headers: { ...defaultRequestHeaders, "Content-Type": "application/json" },
})
