"use client";

import { MapRefreshConfig, RevalidateError } from "@/utils/types";
import useSWR from "swr";
import { getFetcher } from "@/utils/fetcher";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VehicleList } from "@/app/components/dynlist";
import dynamic from "next/dynamic";
import LoadMapScreen from "@/app/components/loadmap";
import Selection from "@/app/components/track_selection";

// This complicated thing with `dynamic` is necessary to disable server side rendering
// for the actual map, which does not work with leaflet.
const _internal_DynamicMap = dynamic(() => import("@/app/components/map"), {
	loading: LoadMapScreen,
	ssr: false
});

/**
 * The dynamic part of the "advanced side-by-side" UI
 * @param initial_focus			The id of the initially focussed vehicle
 * @param track_data			The data of the selected track
 * @param logged_in				Whether the user is currently logged in
 * @param initial_position		The initial map position
 * @param server_vehicles		A server-fetched list of vehicles
 * @param track_id				The id of the selected track
 * @param initial_zoom_level	The initial zoom level of the map
 * @param points_of_interest	A list of points of interest on the track
 * @param poi_types				A list of point of interest types
 */
export default function DynamicMapList({
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
		if (error instanceof RevalidateError && error.statusCode == 401) {
			console.log("Invalid token");
			router.refresh();
		}
		console.log("revalidation error", error);
	}
	// manage focus state
	const [focus, setFocus] = useState(initial_focus);

	// sort the vehicles
	const sorted_vehicles = vehicles?.sort((a, b) => a.id - b.id);

	return (
		// The map needs to have a specified height, so I chose 96 tailwind units.
		// The `grow` class will however still cause the map to take up the available space.
		<div className={"basis-96 grow flex gap-2"}>
			<div className={"grow relative"}>
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
			</div>
			<div className={"basis-30 flex flex-col gap-2 mr-2"}>
				<div className={"grow overflow-y-auto basis-0"}>
					<VehicleList
						sorted_vehicles={sorted_vehicles}
						compact={true}
						FocusVehicle={({ v }) => (
							<button
								className={
									"rounded-full bg-slate-700 text-white dark:bg-slate-200 dark:text-black mt-1.5 px-3"
								}
								onClick={() => setFocus(v.id)}>
								Fokussieren
							</button>
						)}
					/>
				</div>
				<div>
					Andere Strecke auswählen:
					<Selection completed={false} setCompleted={() => {}} />
				</div>
			</div>
		</div>
	);
}
