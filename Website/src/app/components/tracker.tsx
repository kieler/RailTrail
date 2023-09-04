import { getFetcher, TrackerIdRoute } from "@/utils/fetcher";
import useSWR from "swr";
import { batteryLevelFormatter } from "@/utils/helpers";

export default function TrackerCharge({ trackerId }: { trackerId: string }) {
	const safeTrackerId = encodeURIComponent(trackerId);
	const { data: tracker_data } = useSWR(`/webapi/tracker/read/${safeTrackerId}`, getFetcher<TrackerIdRoute>);

	return (
		<>
			{tracker_data && (
				<div className={"w-full flex flex-nowrap my-1 gap-1"}>
					<div className={"group relative sm:grow shrink min-w-0 basis-32 text-left"}>
						<div className={"truncate w-32 sm:w-full max-w-full min-w-0"}>{tracker_data.id}</div>
						<div
							className={
								"opacity-0 group-hover:opacity-100 z-10 transition-opacity pointer-events-none absolute bg-gray-100 rounded py-2 px-3 top-5 w-max"
							}>
							{tracker_data.id}
						</div>
					</div>
					<div className={"basis-10 text-right shrink-0"}>
						{tracker_data.battery == undefined ? "?" : batteryLevelFormatter.format(tracker_data.battery)}
					</div>
				</div>
			)}
		</>
	);
}
