import { LatLngExpression } from "leaflet"
import { Vehicle } from "./api.website"

export interface IMapConfig {
  position: LatLngExpression,
  zoom_level: number,
  server_vehicles: Vehicle[],
  track_id: number
}
