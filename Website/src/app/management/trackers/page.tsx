import TrackerManagement from "./client";
import {cookies} from "next/headers";
import {getAllVehicles} from "@/utils/data";

export default async function Page() {

    const token = cookies().get('token')?.value;

    // fetch the vehicle types on the server side.
    const vehicles = token ? await getAllVehicles(token) : [];

    return <TrackerManagement vehicles={vehicles}/>
}