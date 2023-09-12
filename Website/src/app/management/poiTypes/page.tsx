import POITypeManagement from "./client";
import { cookies } from "next/headers";
import { LoginDialog } from "@/app/components/login";

export default async function Page() {
	const hasToken = cookies().has("token");

	return (
		<>
			{!hasToken && <LoginDialog>Sie müssen sich anmelden!</LoginDialog>}
			<POITypeManagement noFetch={!hasToken} />
		</>
	);
}
