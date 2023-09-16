import { cookies } from "next/headers";
import VehicleManagement from "./client";
import { getAllTrackers, getAllVehicleTypes, getTrackList } from "@/utils/data";
import { ExceptionMessage } from "@/app/management/components/exceptionMessage";
import { LoginDialog } from "@/app/components/login";

/**
 * The server-side things for the vehicle management page
 */
export default async function Page() {
	const token = cookies().get("token")?.value;

	try {
		// fetch the vehicle types on the server side.
		const vehicleTypes = token ? await getAllVehicleTypes(token) : [];
		const tracks = token ? await getTrackList(token) : [];
		const trackers = token ? await getAllTrackers(token) : [];

		return (
			<>
				{!token && <LoginDialog>Sie müssen sich anmelden!</LoginDialog>}
				<VehicleManagement {...{ vehicleTypes, tracks, trackers }} noFetch={token == undefined} />
			</>
		);
	} catch (e) {
		return <ExceptionMessage error={e} />;
	}
}
