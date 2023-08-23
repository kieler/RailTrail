import { cookies } from "next/headers";
import { getTrackData, getAllVehiclesOnTrack, getAllPOIsOnTrack, getAllPOITypes } from "@/utils/data";
import LoginWrapper from "@/app/components/login_wrap";
import { FullTrack, PointOfInterest, POIType, Vehicle } from "@/utils/api";
import DynamicList from "@/app/components/dynlist";

export default async function Home() {
	const token = cookies().get("token")?.value;
	const track_id = parseInt(cookies().get("track_id")?.value ?? "", 10);
	const track_selected = !isNaN(track_id);
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

	console.log("server vehicles", server_vehicles);
	return (
		<main className="container mx-auto max-w-4xl grow">
			<div className={"bg-white p-4 rounded"}>
				<LoginWrapper
					logged_in={token !== undefined}
					track_selected={track_selected}
					map_conf={{
						position: { lat: 54.2333, lng: 10.6024 },
						zoom_level: 11,
						server_vehicles,
						track_data,
						track_id,
						points_of_interest,
						poi_types
					}}
					child={DynamicList}
				/>
			</div>
		</main>
	);
}
