import { cookies } from "next/headers";
import POIManagement from "./client";
import { getAllPOITypes, getAllTrackers, getAllVehicleTypes, getTrackList } from "@/utils/data";

export default async function Page() {
	const token = cookies().get("token")?.value;

	// fetch the vehicle types on the server side.
	const poiTypes = token ? await getAllPOITypes(token) : [];
	const tracks = token ? await getTrackList(token) : [];

	return <POIManagement {...{ poiTypes, tracks }} />;
}
