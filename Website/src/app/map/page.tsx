//import Map from '@/components/map'

import DynamicMap from '@/components/dynmap';
import {cookies} from 'next/headers';
import {getInitData, getVehicleData} from '@/lib/data';
import {LoginDialog} from "@/components/login";
import LoginMapWrapper from "@/components/login_map";
import {InitResponse, Vehicle} from "@/lib/api.website";

export default async function Home() {

  const token = cookies().get("token")?.value;
  const track_id = parseInt(cookies().get("track_id")?.value ?? '', 10)
  let server_vehicles: Vehicle[];
  let init_data: InitResponse | undefined;
    try {
        init_data = token ? await getInitData(token, track_id) : undefined;
        server_vehicles = token ? await getVehicleData(token, track_id) : [];
    } catch (e) {
        console.log('Catched e');
        init_data = undefined;
        server_vehicles = []
    }


  console.log("server vehicles", server_vehicles)
  return (
      <LoginMapWrapper logged_in={token !== undefined} track_selected={!isNaN(track_id)} map_conf={
        {
          position: {lat: 54.2333, lng: 10.6024},
          zoom_level: 11,
          server_vehicles,
          track_id,
          init_data
        }
      } />
  )
}
