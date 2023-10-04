"use client";
import dynamic from "next/dynamic";
import LoadMapScreen from "./loadmap";
import { MapRefreshConfig, RevalidateError, UnauthorizedError } from "@/utils/types";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFetcher } from "@/utils/fetcher";
import { SelectTrackButton } from "@/app/components/selectTrackButton";

// This complicated thing with `dynamic` is necessary to disable server side rendering
// for the actual map, which does not work with leaflet.
const _internal_DynamicMap = dynamic(() => import("@/app/components/map"), {
	loading: LoadMapScreen,
	ssr: false
});

/**
 * A dynamic map of vehicles with their current position.
 * @param focus                 The id of the vehicle that should be initially focussed on, or undefined if none exists.
 * @param server_vehicles       A pre-fetched list of vehicles to be used until this data is fetched on the client side.
 * @param track_id              The id of the currently selected track.  # TODO: remove redundant variable -> already in track_data
 * @param logged_in             A boolean indicating if the user is logged in.
 * @param track_data            The information about the currently selected track.
 * @param initial_position      The initial center of the map. Effectively only meaningful if focus === undefined.
 * @param initial_zoom_level    The initial zoom level of the map. In Leaflet/OSM zoom levels
 * @param points_of_interest    A server-fetched list of Points of Interest to display on the map.
 * @param poi_types				A server-fetched list of POI Types
 */
export default function DynamicMap({
	initial_focus,
	track_data,
	logged_in,
	initial_position,
	server_vehicles,
	track_id,
	initial_zoom_level,
	points_of_interest,
	poi_types
}: MapRefreshConfig) {
	// use SWR to periodically re-fetch vehicle positions
	const { data: vehicles, error } = useSWR(
		logged_in && track_id ? `/webapi/vehicles/list/${track_id}` : null,
		getFetcher<`/webapi/vehicles/list/${number}`>,
		{
			refreshInterval: 1000,
			fallbackData: server_vehicles
		}
	);

	const router = useRouter();

	// log the user out if revalidation fails with a 401 response (this assumes that the request handler removed the cookie)
	if (logged_in && error) {
		if (error instanceof UnauthorizedError || (error instanceof RevalidateError && error.statusCode === 401)) {
			console.log("Invalid token");
			router.refresh();
		}
		console.log("revalidation error", error);
	}
	// manage focus state
	const [focus, setFocus] = useState(initial_focus);

	return (
		// The map needs to have a specified height, so I chose 96 tailwind units.
		// The `grow` class will however still cause the map to take up the available space.
		<div className={"basis-96 grow relative"}>
			<_internal_DynamicMap
				{...{
					initial_position,
					initial_zoom_level,
					vehicles,
					track_data,
					points_of_interest,
					poi_types,
					focus,
					setFocus
				}}
			/>
			{/* This will stack over the map, if all map layers have a z-index < 1100 (which should be the default) */}
			<div className={"absolute left-5 bottom-5 z-1100"}>
				<SelectTrackButton />
			</div>
		</div>
	);
}
