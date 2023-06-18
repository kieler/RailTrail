//import Map from '@/components/map'

import dynamic from 'next/dynamic';
import LoadMapScreen from '@/components/loadmap'
import {IMapConfig} from '@/lib/types'
import { PropsWithChildren } from 'react';
import { Vehicle } from '@/lib/api.website';
import DynamicMap from '@/components/dynmap';
import { cookies, headers } from 'next/headers';
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { redirect } from 'next/navigation';
import { getVehicleData } from '@/lib/data';

const getInitData = async (context: {token?: string, track_id: number}) => {
  // TODO:
}

export default async function Home() {

  const token = cookies().get("token")?.value;
  const track_id = 0

  if (token) {
  const server_vehicles = await getVehicleData(token, track_id)

  console.log("server vehicles", server_vehicles)
  return (
    <div className='h-full min-h-screen'>
      {/* <div>Foo bar baz!</div> */}
      <DynamicMap
      position = {{lat: 54.2333, lng: 10.6024}}
      zoom_level = {11}
      server_vehicles={server_vehicles}
      track_id={track_id}/>
    </div>
  )
  } else {
    redirect("/login");
    return (
      <p>You need to login <a href="/login">here</a></p>
    )
  }
}
