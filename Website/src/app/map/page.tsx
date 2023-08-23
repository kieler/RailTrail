//import Map from '@/components/map'

import DynamicMap from "@/app/components/dynmap";
import { cookies } from "next/headers";
import { getAllPOIsOnTrack, getAllPOITypes, getAllVehiclesOnTrack, getTrackData } from "@/utils/data";
import LoginWrapper from "@/app/components/login_wrap";
import { FullTrack, PointOfInterest, POIType, Vehicle } from "@/utils/api";
import { nanToUndefined } from "@/utils/helpers";

export default async function MapPage({ searchParams }: { searchParams: { focus?: string; success?: string } }) {
	console.log("params", searchParams);

	// get the login token and the ID of the selected track
	const token = cookies().get("token")?.value;
	const track_id = parseInt(cookies().get("track_id")?.value ?? "", 10);
	const track_selected = !isNaN(track_id);

	// try to fetch initial data from the backend, but only if the user has a token, and has a track selected.
	// let server_vehicles: Vehicle[];
	// let init_data: FullTrack | undefined;
	// let pois: PointOfInterest;
	// try {
	//     init_data = (token && track_selected) ? await getInitData(token, track_id) : undefined;
	//     server_vehicles = (token && track_selected) ? await getVehicleData(token, track_id) : [];
	// } catch (e) {
	//     console.error('Error fetching Map Data from the Backend:', e);
	//     init_data = undefined;
	//     server_vehicles = []
	// }
	const [track_data, server_vehicles, points_of_interest, poi_types]: [
		FullTrack | undefined,
		Vehicle[],
		PointOfInterest[],
		POIType[]
	] = !(token && track_selected)
		? [undefined, [] as Vehicle[], [] as PointOfInterest[], [] as POIType[]]
		: await Promise.all([
				getTrackData(token, track_id),
				getAllVehiclesOnTrack(token, track_id),
				getAllPOIsOnTrack(token, track_id),
				getAllPOITypes(token)
		  ]).catch(e => {
				console.error("Error fetching Map Data from the Backend:", e);
				return [undefined, [], [], []];
		  });
	// also process the parameter allowing to specify the initial focussed vehicle
	const focus = nanToUndefined(parseInt(searchParams.focus ?? "", 10));

	return (
		<LoginWrapper
			logged_in={token !== undefined}
			track_selected={track_selected}
			map_conf={{
				position: { lat: 54.2333, lng: 10.6024 },
				zoom_level: 11.5,
				server_vehicles,
				track_id,
				track_data,
				points_of_interest,
				poi_types,
				focus
			}}
			child={DynamicMap}
		/>
	);
}
