import { LatLngExpression } from "leaflet"
import { Vehicle } from "./api_types"

export interface IMapConfig {
  position: LatLngExpression,
  zoom_level: number,
  server_vehicles: Vehicle[]
}
