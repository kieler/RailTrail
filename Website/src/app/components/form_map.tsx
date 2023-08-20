"use client";
import L, { DragEndEvent, LatLng } from "leaflet";
import "leaflet-rotatedmarker";
import "leaflet/dist/leaflet.css";
import { FullTrack } from "@/utils/api";
import dynamic from "next/dynamic";
import { Dispatch, useEffect, useMemo, useRef } from "react";
import assert from "assert";

/**
 * A form element that MUST NOT be rendered server side.
 */
function InternalPositionSelector({
	track_data,
	position,
	setPosition,
	setModified,
	zoom_level,
	height
}: {
	position: LatLng;
	setPosition: Dispatch<LatLng>;
	setModified?: Dispatch<boolean>;
	zoom_level: number;
	track_data?: FullTrack;
	height: number | string;
}) {
	const mapContainerRef = useRef(null as HTMLDivElement | null);
	const mapRef = useRef(undefined as L.Map | undefined);
	const markerRef = useRef(undefined as L.Marker | undefined);
	const markerIcon = useMemo(() => new L.Icon.Default({ imagePath: "/" }), []);

	/** handling the initialization of leaflet. MUST NOT be called twice. */
	function insertMap() {
		// debugger;
		// console.log(mapRef, mapRef.current);
		assert(mapContainerRef.current, "Error: Ref to Map Container not populated");
		assert(mapRef.current == undefined, "Error: Trying to insert map more than once");
		mapRef.current = L.map(mapContainerRef.current);

		L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(mapRef.current);

		markerRef.current = L.marker([0, 0], { draggable: true, icon: markerIcon }).addTo(mapRef.current);
		markerRef.current?.on("dragend", (e: DragEndEvent) => {
			setPosition(e.target.getLatLng());
			if (setModified) {
				setModified(true);
			}
		});
	}

	/** Set the zoom level of the map */
	function setMapZoom() {
		assert(mapRef.current != undefined, "Error: Map not ready!");

		mapRef.current.setZoom(zoom_level);
	}

	/** Set the center of the map. The zoom level MUST be set before, otherwise leaflet will crash. */
	function setMapPosition() {
		assert(mapRef.current != undefined, "Error: Map not ready!");
		assert(!Number.isNaN(mapRef.current?.getZoom()), "Error: ZoomLevel MUST be set before position is set!");

		mapRef.current.setView(position);
		markerRef.current?.setLatLng(position);
	}

	/** insert the path of the track from the init data */
	function addTrackPath() {
		assert(mapRef.current != undefined, "Error: Map not ready!");

		const trackPath = L.geoJSON(track_data?.path, { style: { color: "darkblue" } });
		trackPath.addTo(mapRef.current);

		// Add a callback to remove the track path to remove the track path in case of a re-render.
		return () => {
			trackPath.remove();
		};
	}

	// Schedule various effects (JS run after the page is rendered) for changes to various state variables.
	useEffect(insertMap, []);
	useEffect(setMapZoom, [zoom_level]);
	useEffect(setMapPosition, [position]);
	useEffect(addTrackPath, [track_data?.path]);

	return <div id="map" style={{ height }} className={"w-full"} ref={mapContainerRef} />;
}

const PositionSelector = dynamic(() => Promise.resolve(InternalPositionSelector), { ssr: false });

export default PositionSelector;
