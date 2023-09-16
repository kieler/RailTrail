import { cookies } from "next/headers";
import { getAllVehiclesOnTrack, getTrackData } from "@/utils/data";
import LoginWrapper from "@/app/components/login_wrap";
import { FullTrack, Vehicle } from "@/utils/api";
import DynamicList from "@/app/components/dynlist";

/**
 * A page containing only the vehicle list
 * @constructor
 */
export default async function Home() {
	const token = cookies().get("token")?.value;
	const track_id = parseInt(cookies().get("track_id")?.value ?? "", 10);
	const track_selected = !isNaN(track_id);
	const [track_data, server_vehicles]: [FullTrack | undefined, Vehicle[]] = !(token && track_selected)
		? [undefined, [] as Vehicle[]]
		: await Promise.all([getTrackData(token, track_id), getAllVehiclesOnTrack(token, track_id)]).catch(e => {
				console.error("Error fetching Map Data from the Backend:", e);
				return [undefined, []];
		  });

	const listConf = {
		server_vehicles,
		track_data,
		track_id
	};

	return (
		<main className="mx-auto w-full max-w-4xl grow">
			<div className={"bg-white dark:bg-slate-800 dark:text-white p-4 rounded"}>
				<LoginWrapper
					logged_in={token !== undefined}
					track_selected={track_selected}
					childConf={listConf}
					child={DynamicList}
				/>
			</div>
		</main>
	);
}
