//import Map from '@/components/map'

import DynamicMap from '@/components/dynmap';
import {cookies} from 'next/headers';
import {getVehicleData} from '@/lib/data';
import {LoginDialog} from "@/components/login";
import LoginMapWrapper from "@/components/login_map";

const getInitData = async (context: {token?: string, track_id: number}) => {
  // TODO:
}

export default async function Home() {

  const token = cookies().get("token")?.value;
  const track_id = 0
  const server_vehicles = token ? await getVehicleData(token, track_id) : [];

  console.log("server vehicles", server_vehicles)
  return (
    <div className='h-full min-h-screen'>
      <LoginMapWrapper logged_in={token !== undefined} map_conf={
        {
          position: {lat: 54.2333, lng: 10.6024},
          zoom_level: 11,
          server_vehicles,
          track_id
        }
      } />
      <footer>
        Foo Bar Baz - Footer Text
      </footer>
    </div>
  )
}
