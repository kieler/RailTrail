//import Map from '@/components/map'

import dynamic from 'next/dynamic';
import LoadMapScreen from '@/components/loadmap'
import {IMapConfig} from '@/components/types'
import { PropsWithChildren } from 'react';
import { Vehicle } from '@/components/api_types';
import DynamicMap from '@/components/dynmap';
import { cookies, headers } from 'next/headers';
import { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

const getInitData = async (context: {headers: ReadonlyHeaders, cookies: ReadonlyRequestCookies}) => {
  console.log("context", context)
  const x = await fetch("http://univis.uni-kiel.de/prg?search=persons&name=Maeckel", { cache: 'no-store' })
  const server_vehicles: Vehicle[] = [{id: 10001, pos: {lat: 54.167874, lng: 10.551120}, heading: 350}, {id: 1, pos: {lat: 54.186246, lng: 10.590345}, heading: 220}, {id: 2, pos: {lat: 54.293222, lng: 10.600721}, heading: 320}];
  if (x.ok) {
    return { server_vehicles: server_vehicles }
  } else {
    return { server_vehicles: [] }
  };
}

export default async function Home() {

  const {server_vehicles} = await getInitData({headers: headers(), cookies: cookies()})

  console.log("server vehicles", server_vehicles)
  return (
    <div className='h-full min-h-screen'>
      <div>Foo bar baz!</div>
      <DynamicMap
      position = {{lat: 54.2333, lng: 10.6024}}
      zoom_level = {13}
      server_vehicles={server_vehicles}/>
    </div>
  )
}
