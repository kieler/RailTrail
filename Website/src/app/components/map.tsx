"use client";
import L from "leaflet"
import "leaflet-rotatedmarker"
import 'leaflet/dist/leaflet.css'
import {useEffect, useMemo, useRef, useState} from "react";
import {IMapConfig} from '@/utils/types'
import {coordinateFormatter} from "@/utils/helpers";
import assert from "assert";
import {createPortal} from "react-dom";
import RotatingVehicleIcon from "@/utils/rotatingIcon";

function Map({
                 focus: initial_focus,
                 track_data,
                 position: initial_position,
                 server_vehicles: vehicles,
                 points_of_interest,
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

        const trackPath = L.geoJSON(track_data?.path, {style: {color: 'darkblue'}})
        trackPath.addTo(mapRef.current)

        // Add a callback to remove the track path to remove the track path in case of a re-render.
        return () => {
            trackPath.remove();
        }
    }

    /** move the vehicle markers and handle focus changes */
    function updateMarkers() {

        assert(mapRef.current != undefined, "Error: Map not ready!");

        console.log('vehicles', vehicles);

        while (markerRef.current.length > vehicles.length) {
            const m = markerRef.current.pop()
            if (m) {
                m.remove()
            } else {
                break;
            }
        }
        vehicles.forEach((v, i) => {
                if (!v.pos) {
                    return;
                }
                if (markerRef.current[i] === undefined) {
                    if (mapRef.current) {
                        const iconBase = document.createElement('div');
                        const markerIcon = new RotatingVehicleIcon(iconBase);
                        // place the marker initially at "null island"
                        markerRef.current[i] = L.marker([0, 0], {
                            icon: markerIcon,
                            rotationOrigin: "center"
                        }).addTo(mapRef.current);
                    }
                }
                const m = markerRef.current[i];
                // update the marker position
                m.setLatLng(v.pos);
                // m.setPopupContent(popupContent(vehicles[i]))
                // set the rotation of the icon
                (m.getIcon() as RotatingVehicleIcon).setRotation(vehicles[i].heading)

                // If the vehicle this marker belongs to, is currently in focus, add a pop-up
                if (v.id === focus) {
                    const current_popup = m.getPopup()
                    // if the marker currently has no associated popup, `m.getPopup()` returns `null` or `undefined`.
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
                    setPosition(v.pos);
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

    /** Add points of interest to the map */
    function addPOIs() {
        // TODO:
    }

    // Schedule various effects (JS run after the page is rendered) for changes to various state variables.
    useEffect(insertMap, []);
    useEffect(setMapZoom, [zoom_level]);
    useEffect(setMapPosition, [position]);
    useEffect(addTrackPath, [track_data?.path]);
    useEffect(updateMarkers, [focus, vehicles]);
    useEffect(addPOIs, [points_of_interest]);

    return (
        <>
            <div id='map' className="h-full" ref={mapContainerRef}/>
            {/* If a vehicle is in focus, and we have a popup open, populate its contents with a portal from here. */}
            {popupContainer && createPortal(vehicleInFocus ?
                <>
                    <h4 className={'col-span-2 basis-full text-xl text-center'}>Vehicle &quot;{vehicleInFocus?.name}&quot;</h4>
                    <div className={'basis-1/2'}>Tracker-Level:</div>
                    <div
                        className={'basis-1/2'}>{vehicleInFocus ? 'TODO' : 'unbekannt'}</div>
                    <div className={'basis-1/2'}>Position:</div>
                    <div
                        className={'basis-1/2'}>{
                        vehicleInFocus?.pos
                            ? <>{coordinateFormatter.format(vehicleInFocus?.pos.lat)} N {coordinateFormatter.format(vehicleInFocus?.pos.lng)} E</>
                            : 'unbekannt'}
                    </div>
                </> : <div/>, popupContainer
            )}
        </>
    );
}


export default Map