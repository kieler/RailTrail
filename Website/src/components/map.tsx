"use client";
import L from "leaflet"
import "leaflet-rotatedmarker"
import 'leaflet/dist/leaflet.css'
import {useEffect, useRef} from "react";
import {createRoot} from "react-dom/client";
import {IMapConfig} from '@/lib/types'
import {Vehicle} from "@/lib/api.website";
import {batteryLevelFormatter, coordinateFormatter} from "@/lib/helpers";

function popupContent({batteryLevel, name, pos}: Vehicle): L.Content {
    const baseContainer = document.createElement('div')
    baseContainer.className = "w-64 flex p-1.5 flex-row flex-wrap"

    const contents = (
        <>
            <h4 className={'col-span-2 basis-full text-xl text-center'}>Vehicle &quot;{name}&quot;</h4>
            <div className={'basis-1/2'}>Tracker-Level:</div>
            <div className={'basis-1/2'}>{batteryLevelFormatter.format(batteryLevel)}</div>
            <div className={'basis-1/2'}>Position:</div>
            <div className={'basis-1/2'}>{coordinateFormatter.format(pos.lat)} N {coordinateFormatter.format(pos.lng)} E</div>
        </>
    )
    const root = createRoot(baseContainer);
    root.render(contents);

    return baseContainer;
}

function Map(props: IMapConfig) {

    // console.log('props', props);

    const {position, zoom_level, server_vehicles, init_data, focus} = props;

    const mapRef = useRef(undefined as L.Map | undefined);
    const markerRef = useRef([] as L.Marker[])
    //const [vehicles, setVehicles] = useState(server_vehicles)
    const vehicles = server_vehicles;
    const mapContainerRef = useRef(null as HTMLDivElement | null)
    const markerIcon = new L.Icon({
        iconUrl: "generic_rail_bound_vehicle.svg",
        iconSize: L.point(45, 45)
    })

    // debugger;

    function renderMap() {
        // debugger;
        // console.log(mapRef, mapRef.current);
        if (!mapContainerRef.current) {
            throw new Error("Ref to Map Container not populated")
        } else if (mapRef.current == undefined) {
            mapRef.current = L.map(mapContainerRef.current);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(mapRef.current);

            /*const openrailwaymap = L.tileLayer('http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
                {
                    attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap',
                    minZoom: 2,
                    maxZoom: 19,
                    tileSize: 256
                }).addTo(mapRef.current);*/

            // console.log(vehicles);
            // L.circle({lat: 54.2, lng: 10.56}, {radius: 5500}).addTo(mapRef.current);
            mapRef.current.setView(position, zoom_level);

            for (const v of vehicles) {
                const m = L.marker(v.pos, {
                    icon: markerIcon,
                    rotationOrigin: "center"
                }).addTo(mapRef.current);
                m.bindPopup(popupContent(v))
                m.setRotationAngle(v.heading || 0)
                if (v.id === focus) {
                    m.openPopup();
                    mapRef.current?.setView(v.pos, zoom_level);
                }
                markerRef.current.push(m);
            }

            // render track path
            console.log('track path',init_data, init_data?.trackPath);
            const trackPath = L.geoJSON(init_data?.trackPath, {style: {color: 'red'}})
            trackPath.addTo(mapRef.current)

        } else {
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
                    m.setPopupContent(popupContent(vehicles[i]))
                    m.setRotationAngle(vehicles[i].heading || 0)
                    if (vehicles[i].id === focus) {
                        m.openPopup();
                        mapRef.current?.setView(vehicles[i].pos, zoom_level);
                    }
                    // L.circle(vehicles[i].pos, {radius: 0.5, color: '#009988'}).addTo(mapRef.current);
                } else {
                    const m = L.marker(vehicles[i].pos, {
                        icon: markerIcon,
                        rotationOrigin: "center"
                    }).addTo(mapRef.current);
                    markerRef.current.push(m);
                    m.bindPopup(popupContent(vehicles[i]))
                    m.setRotationAngle(vehicles[i].heading || 0)
                    if (vehicles[i].id === focus) {
                        m.openPopup();
                        mapRef.current?.setView(vehicles[i].pos, zoom_level);
                    }
                }

            }
        }
    }

    useEffect(renderMap)

    return (
        <div id='map' className="h-full" ref={mapContainerRef}/>
    );
}


export default Map