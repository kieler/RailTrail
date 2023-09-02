import {getFetcher, TrackerIdRoute} from "@/utils/fetcher";
import useSWR from "swr";

export default function TrackerCharge({trackerId}: {trackerId: string}) {

    const safeTrackerId = encodeURIComponent(trackerId);
    const {data: tracker_data} = useSWR(`/webapi/tracker/read/${safeTrackerId}`, getFetcher<TrackerIdRoute>)

    return (<div>{tracker_data && <>{tracker_data.id}: {tracker_data.data ?? "unbekannt"} %</>}</div>)

}