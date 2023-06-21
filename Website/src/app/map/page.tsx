//import Map from '@/components/map'

import DynamicMap from '@/components/dynmap';
import {cookies} from 'next/headers';
import {getVehicleData} from '@/lib/data';
import {LoginDialog} from "@/components/login";

const getInitData = async (context: {token?: string, track_id: number}) => {
  // TODO:
}

export default async function Home() {

  const token = cookies().get("token")?.value;
  const track_id = 0
  const server_vehicles = token ? await getVehicleData(token, track_id) : [];
  const dyn_map = <DynamicMap
  position = {{lat: 54.2333, lng: 10.6024}}
  zoom_level = {11}
  server_vehicles={server_vehicles}
  track_id={track_id}
  logged_in={token !== undefined}/>

  console.log("server vehicles", server_vehicles)
  return (
    <div className='h-full min-h-screen'>
      {token ? <></> : (
          <LoginDialog description="You need to log in!" dst_url='/map' foo={dyn_map} />
          )
      }
      {dyn_map}
      <footer>
        Foo Bar Baz - Footer Text
      </footer>
    </div>
  )
}
