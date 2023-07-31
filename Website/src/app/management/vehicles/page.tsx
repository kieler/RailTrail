import {getCookie} from "cookies-next";
import {cookies} from "next/headers";
import VehicleManagement from "./client";
import {getVehicleTypeList} from "@/utils/data";

export default async function Page() {
    const trackID = cookies().get('track_id')?.value;
    const token = cookies().get('token')?.value;

    // fetch the vehicle types on the server side.
    const vehicleTypes = token ? await getVehicleTypeList(token) : [];

    return <VehicleManagement {...{trackID, vehicleTypes}}/>
}