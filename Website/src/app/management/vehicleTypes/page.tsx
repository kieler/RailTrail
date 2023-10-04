import VehicleTypeManagement from "./client";
import { cookies } from "next/headers";
import { LoginDialog } from "@/app/components/login";

/**
 * The server-side things for the vehicle management.
 * @constructor
 */
export default async function Page() {
	const hasToken = cookies().has("token");

	return (
		<>
			{!hasToken && <LoginDialog>Sie müssen sich anmelden!</LoginDialog>}
			<VehicleTypeManagement noFetch={!hasToken} />
		</>
	);
}
