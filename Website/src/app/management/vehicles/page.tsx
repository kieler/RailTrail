import {cookies} from "next/headers";
import VehicleManagement from "./client";
import {getAllTrackers, getAllVehicleTypes, getTrackList} from "@/utils/data";

export default async function Page() {
    const token = cookies().get('token')?.value;

    // fetch the vehicle types on the server side.
    const vehicleTypes = token ? await getAllVehicleTypes(token) : [];
    const tracks = token ? await getTrackList(token) : [];
    const trackers = token ? await getAllTrackers(token) : [];

    return <VehicleManagement {...{vehicleTypes, tracks, trackers}}/>
}