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
  console.log(props)

  const [vehicles, setVehicles] = useState(server_vehicles)

  let i = useRef(1)
  function updateVehicles() {
    console.log('Updating vehicle positions!')
    const vehicles: Vehicle[] = [
      {id: 0, pos: {lat: 54.17 + 0.05 * Math.cos(i.current * Math.PI / 180), lng: 10.56 + 0.085 * Math.sin(i.current * Math.PI / 180)}, heading: i.current + 90 },
      {id: 0, pos: {lat: 54.2 + 0.05 * Math.cos((i.current + 180) * Math.PI / 180), lng: 10.56 + 0.085 * Math.sin((i.current + 180) * Math.PI / 180) }, heading: i.current - 90}
    ];
    i.current+=5.1;
    setVehicles(vehicles);
  }
  
  useEffect(() => {setTimeout(updateVehicles, 100); return});
  
  return (
  <div style={{ height: '90vh' }}>
    <_internal_DynamicMap
      position={position} zoom_level={zoom_level} server_vehicles={vehicles}
    />
    </div>
    )
}