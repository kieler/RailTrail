"use client";
import L from "leaflet"
import "leaflet-rotatedmarker"
import 'leaflet/dist/leaflet.css'
import { Dispatch, MutableRefObject, SetStateAction, useEffect, useRef, useState } from "react";
import { IMapConfig } from './types'
import { Vehicle } from "./api_types";

function Map(props: React.PropsWithChildren<IMapConfig>) {

  console.log('props', props);
  
  const { position, zoom_level, server_vehicles } = props;
  
  const mapRef = useRef(undefined as L.Map | undefined);
  const markerRef = useRef([] as L.Marker[])
  //const [vehicles, setVehicles] = useState(server_vehicles)
  const vehicles = server_vehicles;
  const mapContainerRef = useRef(undefined as HTMLDivElement | undefined)
  const markerIcon = new L.Icon({
    iconUrl: "generic_rail_bound_vehicle.svg",
    iconSize: L.point(45,45)
  })
  // debugger;

  function renderMap() {
    // debugger;
    console.log(mapRef, mapRef.current);
    if (!mapContainerRef.current) {
      throw new Error("Ref to Map Container not populated")
    }
    else if (mapRef.current == undefined) {
      mapRef.current = L.map(mapContainerRef.current);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapRef.current);

      let openrailwaymap = L.tileLayer('http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
        {
          attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap',
          minZoom: 2,
          maxZoom: 19,
          tileSize: 256
        }).addTo(mapRef.current);

      console.log(vehicles);
      L.circle({lat: 54.2, lng: 10.56}, {radius: 5500}).addTo(mapRef.current);

      for (const v of vehicles) {
        const m = L.marker(v.pos, {
          icon: markerIcon,
          rotationOrigin: "center"
        }).addTo(mapRef.current);
        m.bindPopup("Generic Rail Vehicle " + v.id)
        m.setRotationAngle(v.heading || 0)
        markerRef.current.push(m);
      }
      mapRef.current.setView(position, zoom_level);
    }
    else {
      while (markerRef.current.length > vehicles.length) {
        const m = markerRef.current.pop()
        if (m) {
          m.remove()
        } else {
          break;
        }
      }
      const max_i = vehicles.length
      for (let i = 0; i < max_i; i++) {
        if (i < markerRef.current.length) {
          const m = markerRef.current[i]
          m.setLatLng(vehicles[i].pos)
          m.setPopupContent("Generic Rail Vehicle " + vehicles[i].id)
          m.setRotationAngle(vehicles[i].heading || 0)
          L.circle(vehicles[i].pos, {radius: 0.5, color: '#009988'}).addTo(mapRef.current);
        } else {
          const m = L.marker(vehicles[i].pos, {
            icon: markerIcon,
            rotationOrigin: "center"
          }).addTo(mapRef.current);
          markerRef.current.push(m);
          m.bindPopup("Generic Rail Vehicle " + vehicles[i].id)
          m.setRotationAngle(vehicles[i].heading || 0)
        }
        
      }
    }
  }
  useEffect(renderMap)

  return (
    <div id='map' className="h-full" ref={mapContainerRef as any} />
  );
}



export default Map