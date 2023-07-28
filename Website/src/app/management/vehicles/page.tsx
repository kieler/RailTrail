import {getCookie} from "cookies-next";
import {cookies} from "next/headers";
import VehicleManagement from "./client";
import {getVehicleTypeList} from "@/lib/data";

export default async function Page() {
    const trackID = cookies().get('track_id')?.value;
    const token = cookies().get('token')?.value;

    const vehicleTypes = token ? await getVehicleTypeList(token) : [];

    return <VehicleManagement {...{trackID, vehicleTypes}}/>
}