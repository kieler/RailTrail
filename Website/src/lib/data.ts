import { Vehicle } from "./api.website";


const BACKEND_BASE_PATH = "http://localhost:8080"

export const getVehicleData = async (token: string, track_id: number) => {
    
    const auth_header_line = `Bearer ${token}`
    const x = await fetch(`http://localhost:8080/api/vehicles/website/${track_id}`, { cache: 'no-store', headers:
    {
      "Authorization": auth_header_line
    } })
    if (x.ok) {
      const data: Vehicle[] = await x.json();
      // console.log("data", data);
      return data
    } else {
      console.log("Could not fetch vehicle positions (server)", x.status, x.statusText)
      return []
    }
  }