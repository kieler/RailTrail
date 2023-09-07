import TrackerManagement from "./client";
import { cookies } from "next/headers";
import { getAllVehicles } from "@/utils/data";
import { ExceptionMessage } from "@/app/management/components/exceptionMessage";
import { LoginDialog } from "@/app/components/login";

export default async function Page() {
	const token = cookies().get("token")?.value;

	try {
		// fetch the vehicle types on the server side.
		const vehicles = token ? await getAllVehicles(token) : [];

		return (
			<>
				{!token && <LoginDialog>Sie müssen sich anmelden!</LoginDialog>}
				<TrackerManagement vehicles={vehicles} noFetch={token == undefined} />
			</>
		);
	} catch (e) {
		return <ExceptionMessage error={e} />;
	}
}
