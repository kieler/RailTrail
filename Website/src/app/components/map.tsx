"use client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapConfig } from "@/utils/types";
import { coordinateFormatter, speedFormatter } from "@/utils/helpers";
import assert from "assert";
import { createPortal } from "react-dom";
import RotatingVehicleIcon from "@/utils/rotatingIcon";
import { PointOfInterest, POIType, POITypeIconValues } from "@/utils/api";
import { POIIconImg } from "@/utils/common";
import TrackerCharge from "@/app/components/tracker";

/**
 * The side lengths of the poi icons in rem
 */
const POI_ICON_SIZES = {
	tiny: 0.5,
	small: 1,
	medium: 2,
	large: 3,
	xl: 4
} as const;

/**
 * Constructs the content of the popup for a POI, without React
 * @param poi		The POI to construct the popup for
 * @param poi_type	The type of that POI
 */
function poiPopupFactory(poi: PointOfInterest, poi_type?: POIType): HTMLDivElement {
	const container = document.createElement("div");

	const heading = container.appendChild(document.createElement("h4"));
	heading.innerText = (poi_type ? poi_type.name + ": " : "") + poi.name;
	heading.className = "col-span-2 basis-full text-xl text-center";
	container.appendChild(document.createElement("p")).innerText = poi.description ?? "";

	return container;
}

/**
 * Actual Leaflet wrapper. MUST NOT be rendered server side.
 */
function Map({
	focus,
	setFocus,
	track_data,
	initial_position,
	vehicles,
	points_of_interest,
	poi_types,
	initial_zoom_level
}: MapConfig) {
	// define a reference to the leaflet map object
	const mapRef = useRef(undefined as L.Map | undefined);
	// and the markers on the map, so these can be reused
	const markerRef = useRef([] as L.Marker[]);
	// as well as a reference to the div where the map should be contained in
	const mapContainerRef = useRef(null as HTMLDivElement | null);

	// We also need state for the center of the map, the vehicle in focus and the container containing the contents of an open popup
	const [position, setPosition] = useState(initial_position);
	const [zoomLevel, setZoomLevel] = useState(initial_zoom_level);
	const [popupContainer, setPopupContainer] = useState(undefined as undefined | HTMLDivElement);

	// find the vehicle that is in focus, but only if either the vehicles, or the focus changes.
	const vehicleInFocus = useMemo(() => vehicles.find(v => v.id == focus), [vehicles, focus]);

	// derive the appropriate POI Icon size from the zoom level. These are arbitrarily chosen values that seemed right to me
	const poiIconSize: keyof typeof POI_ICON_SIZES =
		zoomLevel < 8 ? "tiny" : zoomLevel < 12 ? "small" : zoomLevel < 14 ? "medium" : zoomLevel < 16 ? "large" : "xl";

	const poiIconSideLength = POI_ICON_SIZES[poiIconSize];

	// create icons for each poi type
	const enriched_poi_types: (POIType & { leaf_icon: L.Icon })[] = useMemo(
		() =>
			poi_types.map(pt => {
				const icon_src = POIIconImg[pt.icon] ?? POIIconImg[POITypeIconValues.Generic];

				// set an initial icon size, will be modified in via css
				const iconSize: [number, number] = [45, 45];

				const leaf_icon = L.icon({ iconUrl: icon_src, iconSize, className: "poi-icon transition-all" });

				return {
					...pt,
					leaf_icon
				};
			}),
		[poi_types]
	);

	/** handling the initialization of leaflet. MUST NOT be called twice. */
	function insertMap() {
		assert(mapContainerRef.current, "Error: Ref to Map Container not populated");
		assert(mapRef.current == undefined, "Error: Trying to insert map more than once");
		mapRef.current = L.map(mapContainerRef.current, {
			zoomSnap: 0.25,
			wheelPxPerZoomLevel: 120
		});

		L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		}).addTo(mapRef.current);

		// create a pane for poi markers so that they are displayed below the vehicle markers.
		const poiPane = mapRef.current!.createPane("poiPane");
		poiPane.style.zIndex = "550";
		poiPane.classList.add("leaflet-marker-pane");
		// as POIs don't have shadows, we don't need a poiShadowPane.
	}

	/**
	 * Add appropriate event listeners to the map
	 */
	function addMapEvents() {
		const map = mapRef.current;
		assert(map != undefined, "Error: Map not ready!");

		map.addEventListener("moveend", () => {
			// prevent infinite loops by checking that the map actually moved
			const newPos = map.getCenter();
			setPosition(oldPos => {
				if (newPos.lng !== oldPos.lng || newPos.lat !== oldPos.lat) {
					return {
						lat: newPos.lat,
						lng: newPos.lng
					};
				}
				return oldPos;
			});
		});

		map.addEventListener("zoomend", () => {
			// React can automatically debounce this, as zoom level is just a number.
			const newZoomLevel = map.getZoom();

			setZoomLevel(newZoomLevel);
		});
	}

	/** Set the zoom level of the map */
	function setMapZoom() {
		assert(mapRef.current != undefined, "Error: Map not ready!");

		mapRef.current.setZoom(zoomLevel);
	}

	/** Set the center of the map. The zoom level MUST be set before, otherwise leaflet will crash. */
	function setMapPosition() {
		assert(mapRef.current != undefined, "Error: Map not ready!");
		assert(!Number.isNaN(mapRef.current?.getZoom()), "Error: ZoomLevel MUST be set before position is set!");

		mapRef.current.setView(position);
	}

	/** insert the path of the track from the init data */
	function addTrackPath() {
		assert(mapRef.current != undefined, "Error: Map not ready!");

		if (track_data == undefined) {
			return;
		}

		// create a GeoJson map layer with the track path
		const trackPath = L.geoJSON(track_data?.path, { style: { color: "darkblue" } });
		trackPath.addTo(mapRef.current);

		// fit the current map to the bounds of the track.
		// honestly, this is pretty sketchy, but it should hopefully not cause problems
		// As track data is never re-fetched while the user is using the map.
		const bounds = trackPath.getBounds();
		mapRef.current!.fitBounds(bounds, { padding: [50, 50] });

		// Add a callback to remove the track path to remove the track path in case of a re-render.
		return () => {
			trackPath.remove();
		};
	}

	/** move the vehicle markers and handle focus changes */
	function updateMarkers() {
		assert(mapRef.current != undefined, "Error: Map not ready!");

		while (markerRef.current.length > vehicles.length) {
			const m = markerRef.current.pop();
			if (m) {
				m.remove();
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
					const iconBase = document.createElement("div");
					const markerIcon = new RotatingVehicleIcon(iconBase);
					// place the marker initially at "null island"
					markerRef.current[i] = L.marker([0, 0], {
						icon: markerIcon
					}).addTo(mapRef.current);
				}
			}
			const m = markerRef.current[i];
			// update the marker position
			m.setLatLng(v.pos);
			// m.setPopupContent(popupContent(vehicles[i]))
			// set the rotation of the icon
			(m.getIcon() as RotatingVehicleIcon).setRotation(vehicles[i].heading);

			const current_popup = m.getPopup();
			// If the vehicle this marker belongs to, is currently in focus, add a pop-up
			if (v.id === focus) {
				// if the marker currently has no associated popup, `m.getPopup()` returns `null` or `undefined`.
				if (current_popup == undefined) {
					// create a div element to contain the popup content.
					// We can then use a React portal to place content in there.
					const popupElement = document.createElement("div");
					popupElement.className = "w-96 flex p-1.5 flex-row flex-wrap";
					m.bindPopup(popupElement, { className: "w-auto", maxWidth: undefined });
					setPopupContainer(popupElement);
					// unset the focussed element on popup closing.
					m.on("popupclose", () => {
						// check if this popup is dismissed, or another popup is opened.
						// This works, because the function closure binds v.
						// If the current focus before the update was not on the vehicle this popup
						// belongs to, do not update state.
						// Also, this is one of the few occasions,
						// where reacts "schedule state update function" feature is useful.
						setFocus(focus => (focus == v.id ? undefined : focus));
					});
				}
				m.openPopup();
				setPosition(v.pos);
			} else {
				if (current_popup != undefined) {
					m.closePopup();
					m.unbindPopup();
				}
			}
			m.on("click", () => {
				// set the vehicle as the focussed vehicle if it is clicked.
				setFocus(v.id);
			});
		});
	}

	/** Add points of interest to the map */
	function addPOIs() {
		assert(mapRef.current != undefined, "Error: Map not ready!");

		const poiMarkers = points_of_interest.map(poi => {
			const poiType = enriched_poi_types.find(pt => pt.id == poi.typeId);
			if (poiType != undefined) {
				return L.marker(poi.pos, {
					icon: poiType?.leaf_icon,
					pane: "poiPane"
				})
					.bindPopup(poiPopupFactory(poi, poiType))
					.addTo(mapRef.current!);
			} else {
				// return a POI with the default icon.
				return L.marker(poi.pos, {
					pane: "poiPane"
				})
					.bindPopup(poiPopupFactory(poi, poiType))
					.addTo(mapRef.current!);
			}
		});

		return () => poiMarkers.forEach(m => m.remove());
	}

	// Schedule various effects (JS run after the page is rendered) for changes to various state variables.
	useEffect(insertMap, []);
	useEffect(addMapEvents, [setPosition, setZoomLevel]);
	useEffect(setMapZoom, [zoomLevel]);
	useEffect(setMapPosition, [position]);
	useEffect(addTrackPath, [track_data?.path, track_data]);
	useEffect(updateMarkers, [focus, setFocus, vehicles]);
	useEffect(addPOIs, [points_of_interest, enriched_poi_types]);

	// set the width and height of all poi icons using an effect to prevent re-rendering the icons
	useEffect(() => {
		// Iterate over all poi icons currently present
		for (const poiIcon of document.querySelectorAll(".poi-icon")) {
			if (poiIcon instanceof HTMLElement) {
				// set the height and width using inline styles.
				// this will probably make this component much more fragile than it needs to be...
				poiIcon.style.width = poiIcon.style.height = `${poiIconSideLength}rem`;

				// we also need to adjust the margins, so that the icons remain centered
				poiIcon.style.marginLeft = poiIcon.style.marginTop = `${-poiIconSideLength / 2}rem`;
			}
		}
	}, [points_of_interest, enriched_poi_types, poiIconSideLength]);

	return (
		<>
			<div id="map" className="absolute inset-0" ref={mapContainerRef} />
			{/* If a vehicle is in focus, and we have a popup open, populate its contents with a portal from here. */}
			{popupContainer &&
				createPortal(
					vehicleInFocus ? (
						<>
							<h2 className={"col-span-2 basis-full text-xl text-center"}>
								Vehicle &quot;{vehicleInFocus?.name}&quot;
							</h2>
							<div className={"basis-1/3"}>Tracker-Ladezustand:</div>
							<div className={"basis-2/3"}>
								{vehicleInFocus
									? vehicleInFocus.trackerIds.map(trackerId => (
											<TrackerCharge key={trackerId} trackerId={trackerId} />
									  ))
									: "unbekannt"}
							</div>
							<div className={"basis-1/3"}>Position:</div>
							<div className={"basis-2/3"}>
								{vehicleInFocus?.pos ? (
									<>
										{coordinateFormatter.format(vehicleInFocus?.pos.lat)} N{" "}
										{coordinateFormatter.format(vehicleInFocus?.pos.lng)} E
									</>
								) : (
									"unbekannt"
								)}
							</div>
							<div className={"basis-1/3"}>Geschwindigkeit:</div>
							<div className={"basis-2/3"}>
								{vehicleInFocus?.speed != undefined && vehicleInFocus.speed !== -1
									? speedFormatter.format(vehicleInFocus.speed)
									: "unbekannt"}
							</div>
						</>
					) : (
						<div />
					),
					popupContainer
				)}
		</>
	);
}

export default Map;
