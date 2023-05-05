import axios from "axios"
import { backendUrl, backendTimeout } from "../util/consts"

export const defaultRequestHeaders = {}

export const Backend = axios.create({
  baseURL: backendUrl,
  timeout: backendTimeout,
  headers: { ...defaultRequestHeaders, "Content-Type": "application/json" },
})
