"use client";
import dynamic from 'next/dynamic';
import LoadMapScreen from './loadmap';
import { Vehicle } from './api_types';
import { IMapConfig } from './types';
import { GetServerSideProps } from 'next';
import { LatLngExpression } from 'leaflet';
import { useEffect, useRef, useState } from 'react';

const _internal_DynamicMap = dynamic(() => import('@/components/map'), {
  loading: LoadMapScreen,
  ssr: false
});

export default function DynamicMap(props: React.PropsWithChildren<IMapConfig>) {
  
  const { position, zoom_level, server_vehicles } = props;
  // console.log(props)

  const [vehicles, setVehicles] = useState(server_vehicles)
  const timeoutRef = useRef(undefined as NodeJS.Timeout | undefined);

  const i = useRef(1)
  async function updateVehicles() {
    const vehicles: Vehicle[] = [
      {id: 0, pos: {lat: 54.17 + 0.05 * Math.cos(i.current * Math.PI / 180), lng: 10.56 + 0.085 * Math.sin(i.current * Math.PI / 180)}, heading: i.current + 90 },
      {id: 42, pos: {lat: 54.2 + 0.05 * Math.cos((i.current + 180) * Math.PI / 180), lng: 10.56 + 0.085 * Math.sin((i.current + 180) * Math.PI / 180) }, heading: i.current - 90}
    ];
    i.current+=5.1;
    let real_vehicles: Vehicle[]
    const x = await fetch("http://localhost:3000/")
    if (x.ok) {
      real_vehicles = vehicles;
    } else {
      real_vehicles = []
    }
    console.log('Updating vehicle positions!', real_vehicles);
    setVehicles(real_vehicles);
  }
  

  useEffect(() => {
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
    timeoutRef.current = setTimeout(() => {      
      console.log("timeout!!"); updateVehicles().catch(() => {}).then()
    }, 1000);
    return () => {
      console.log("Cancelled!");
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    };
  })
  
  return (
  <div style={{ height: '90vh' }}>
    <_internal_DynamicMap
      position={position} zoom_level={zoom_level} server_vehicles={vehicles}
    />
    </div>
    )
}