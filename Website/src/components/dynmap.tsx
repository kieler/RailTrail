"use client";
import dynamic from 'next/dynamic';
import LoadMapScreen from './loadmap';
import {Vehicle} from "@/lib/api.website";
import {IMapConfig} from '@/lib/types';
import {useEffect, useRef, useState} from 'react';
import {clearInterval, setInterval} from 'timers';

const _internal_DynamicMap = dynamic(() => import('@/components/map'), {
  loading: LoadMapScreen,
  ssr: false
});

export default function DynamicMap(props: React.PropsWithChildren<IMapConfig>) {
  
  const { position, zoom_level, server_vehicles, track_id, logged_in } = props;
  // console.log(props)

  const [vehicles, setVehicles] = useState(server_vehicles)
  // const timeoutRef = useRef(undefined as NodeJS.Timeout | undefined);

  const i = useRef(1)
  async function updateVehicles() {
    const test_vehicle: Vehicle = {id: 0, pos: {lat: 54.17 + 0.05 * Math.cos(i.current * Math.PI / 180), lng: 10.56 + 0.085 * Math.sin(i.current * Math.PI / 180)}, heading: i.current + 90, name: 'foo', batteryLevel: 0.5};
    //   {id: 42, pos: {lat: 54.2 + 0.05 * Math.cos((i.current + 180) * Math.PI / 180), lng: 10.56 + 0.085 * Math.sin((i.current + 180) * Math.PI / 180) }, heading: i.current - 90, name: 'bar', batteryLevel: 1}
    // ];
    i.current+=5.1;
    let real_vehicles: Vehicle[]
    const x = await fetch(`/api/update`, { cache: 'no-store', method: "POST", body: JSON.stringify({"track_id": track_id}) })
    if (x.ok) {
      // debugger;
      real_vehicles = await x.json();
    } else {
      console.log("Could not fetch vehicle positions", x.status, x.statusText)
      real_vehicles = []
    }
    // debugger;
    real_vehicles = real_vehicles.concat([test_vehicle]);
    console.log('Updating vehicle positions!', real_vehicles);
    setVehicles(real_vehicles);
  }
  

  useEffect(() => {
    if (!logged_in) {
      return;
    }
    console.log("Effect");
    // debugger;
    // if (1 || !timeoutRef.current)
    //   timeoutRef.current = new Promise(resolve => setTimeout(resolve, 1000)).then(
    //     updateVehicles
    //   ).then(
    //     async () => {
    //       console.log("Foo!");
    //       await undefined;
    //     }
    //   )
    // timeoutRef.current = setTimeout(() => {      
    //   console.log("timeout!!"); updateVehicles().catch(() => {}).then()
    // }, 1000);
    // return () => {
    //   console.log("Cancelled!");
    //   clearTimeout(timeoutRef.current);
    //   timeoutRef.current = undefined;
    // };
    const interval = setInterval(() => updateVehicles().catch(console.error), 1000);
    return () => {
      console.log("effect cancelled");
      clearInterval(interval);
    }
  })
  
  return (
  <div style={{ height: '90vh' }}>
    <_internal_DynamicMap
      position={position} zoom_level={zoom_level} server_vehicles={vehicles} track_id={track_id} logged_in={logged_in}
    />
    </div>
    )
}