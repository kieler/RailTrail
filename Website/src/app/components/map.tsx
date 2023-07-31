"use client";
import L from "leaflet"
import "leaflet-rotatedmarker"
import 'leaflet/dist/leaflet.css'
import {useEffect, useMemo, useRef, useState} from "react";
import {IMapConfig} from '@/utils/types'
import {batteryLevelFormatter, coordinateFormatter} from "@/utils/helpers";
import assert from "assert";
import {createPortal} from "react-dom";

function Map({
                 focus: initial_focus,
                 init_data,
                 position: initial_position,
                 server_vehicles: vehicles,
                 zoom_level
             }: IMapConfig) {


    // define a reference to the leaflet map object
    const mapRef = useRef(undefined as L.Map | undefined);
    // and the markers on the map, so these can be reused
    const markerRef = useRef([] as L.Marker[])
    // as well as a reference to the div where the map should be contained in
    const mapContainerRef = useRef(null as HTMLDivElement | null)

    // We also need state for the center of the map, the vehicle in focus and the container containing the contents of an open popup
    const [position, setPosition] = useState(initial_position)
    const [focus, setFocus] = useState(initial_focus);
    const [popupContainer, setPopupContainer] = useState(undefined as undefined | HTMLDivElement);

    // TODO: use new partially rotating icon
    const markerIcon = useMemo(() => new L.Icon({
        iconUrl: "generic_rail_bound_vehicle.svg",
        iconSize: L.point(45, 45)
    }), []);

    // find the vehicle that is in focus, but only if either the vehicles, or the focus changes.
    const vehicleInFocus = useMemo(
        () => vehicles.find((v) => v.id == focus),
        [vehicles, focus]);

    // debugger;

    /** handling the initialization of leaflet. MUST NOT be called twice. */
    function insertMap() {
        // debugger;
        // console.log(mapRef, mapRef.current);
        assert(mapContainerRef.current, "Error: Ref to Map Container not populated");
        assert(mapRef.current == undefined, "Error: Trying to insert map more than once");
        mapRef.current = L.map(mapContainerRef.current);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapRef.current);

        /*const openrailwaymap = L.tileLayer('http://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
            {
                attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, Style: <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA 2.0</a> <a href="http://www.openrailwaymap.org/">OpenRailwayMap</a> and OpenStreetMap',
                minZoom: 2,
                maxZoom: 19,
                tileSize: 256
            }).addTo(mapRef.current);*/

    }

    /** Set the zoom level of the map */
    function setMapZoom() {
        assert(mapRef.current != undefined, "Error: Map not ready!");

        mapRef.current.setZoom(zoom_level);
    }

    /** Set the center of the map. The zoom level MUST be set before, otherwise leaflet will crash. */
    function setMapPosition() {
        assert(mapRef.current != undefined, "Error: Map not ready!");
        assert(!Number.isNaN(mapRef.current?.getZoom()), "Error: ZoomLevel MUST be set before position is set!")

        mapRef.current.setView(position);
    }


    /** insert the path of the track from the init data */
    function addTrackPath() {
        assert(mapRef.current != undefined, "Error: Map not ready!");

        const trackPath = L.geoJSON(init_data?.trackPath, {style: {color: 'red'}})
        trackPath.addTo(mapRef.current)

        // Add a callback to remove the track path to remove the track path in case of a re-render.
        return () => {
            trackPath.remove();
        }
    }

    /** move the vehicle markers and handle focus changes */
    function updateMarkers() {

        assert(mapRef.current != undefined, "Error: Map not ready!");

        while (markerRef.current.length > vehicles.length) {
            const m = markerRef.current.pop()
            if (m) {
                m.remove()
            } else {
                break;
            }
        }
        vehicles.forEach((v, i) => {
                if (i >= markerRef.current.length) {
                    if (mapRef.current) {
                        const m = L.marker(vehicles[i].pos, {
                            icon: markerIcon,
                            rotationOrigin: "center"
                        }).addTo(mapRef.current);
                        markerRef.current.push(m);
                    }
                }
                const m = markerRef.current[i];
                m.setLatLng(vehicles[i].pos)
                // m.setPopupContent(popupContent(vehicles[i]))
                m.setRotationAngle(vehicles[i].heading || 0)

                if (v.id === focus) {
                    const current_popup = m.getPopup()
                    if (current_popup == undefined) {
                        // create a div element to contain the popup content.
                        // We can then use a React portal to place content in there.
                        const popupElement = document.createElement('div');
                        popupElement.className = "w-64 flex p-1.5 flex-row flex-wrap";
                        m.bindPopup(popupElement);
                        setPopupContainer(popupElement);
                        // unset the focussed element on popup closing.
                        m.on('popupclose', () => {
                            setFocus(undefined)
                        })
                    }
                    m.openPopup();
                    setPosition(vehicles[i].pos);
                } else {
                    m.closePopup();
                    m.unbindPopup();
                }
                m.on('click', () => {
                    // set the vehicle as the focussed vehicle if it is clicked.
                    setFocus(v.id)
                })

            }
        )
    }

    // Schedule various effects (JS run after the page is rendered) for changes to various state variables.
    useEffect(insertMap, []);
    useEffect(setMapZoom, [zoom_level]);
    useEffect(setMapPosition, [position]);
    useEffect(addTrackPath, [init_data?.trackPath]);
    useEffect(updateMarkers, [focus, markerIcon, vehicles]);

    return (
        <>
            <div id='map' className="h-full" ref={mapContainerRef}/>
            {/* If a vehicle is in focus, and we have a popup open, populate its contents with a portal from here. */}
            {popupContainer && createPortal(vehicleInFocus ?
                <>
                    <h4 className={'col-span-2 basis-full text-xl text-center'}>Vehicle &quot;{vehicleInFocus?.name}&quot;</h4>
                    <div className={'basis-1/2'}>Tracker-Level:</div>
                    <div
                        className={'basis-1/2'}>{vehicleInFocus ? batteryLevelFormatter.format(vehicleInFocus.batteryLevel) : 'unbekannt'}</div>
                    <div className={'basis-1/2'}>Position:</div>
                    <div
                        className={'basis-1/2'}>{
                        vehicleInFocus
                            ? <>{coordinateFormatter.format(vehicleInFocus?.pos.lat)} N {coordinateFormatter.format(vehicleInFocus?.pos.lng)} E</>
                            : 'unbekannt'}
                    </div>
                </> : <div/>, popupContainer
            )}
        </>
    );
}


export default Map