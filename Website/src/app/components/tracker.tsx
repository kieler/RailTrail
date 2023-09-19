import { getFetcher, TrackerIdRoute } from "@/utils/fetcher";
import useSWR from "swr";
import { batteryLevelFormatter } from "@/utils/helpers";

/**
 * Component displaying the charge of a tracker with a given
 * @param trackerId
 * @constructor
 */
export default function TrackerCharge({ trackerId }: { trackerId: string }) {
	const safeTrackerId = encodeURIComponent(trackerId);
	const { data: tracker_data } = useSWR(`/webapi/tracker/read/${safeTrackerId}`, getFetcher<TrackerIdRoute>);

	return (
		<>
			{tracker_data && (
				<div className={"flex flex-nowrap my-1 gap-1 min-w-0 w-32 sm:w-44 md:w-52 xl:w-64"}>
					<div className={"group relative grow-0 md:grow shrink min-w-0 basis-30 lg:basis-32 text-left"}>
						<div className={"truncate basis-32 sm:w-full max-w-full min-w-0"}>{tracker_data.id}</div>
						<div
							className={
								"opacity-0 group-hover:opacity-100 z-10 transition-opacity pointer-events-none absolute dark:bg-gray-900 dark:text-white bg-gray-100 rounded py-2 px-3 top-8 -left-3 w-max"
							}>
							{tracker_data.id}
						</div>
					</div>
					<div className={"basis-14 text-right shrink-0"}>
						{tracker_data.battery == undefined ? "?" : batteryLevelFormatter.format(tracker_data.battery)}
					</div>
				</div>
			)}
		</>
	);
}
