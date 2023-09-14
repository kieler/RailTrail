import { cookies } from "next/headers";
import POIManagement from "./client";
import { getAllPOITypes, getTrackList } from "@/utils/data";
import { LoginDialog } from "@/app/components/login";

import { ExceptionMessage } from "@/app/management/components/exceptionMessage";

export const revalidate = 0;

/**
 * Basic server-side things for the poi management page
 */
export default async function Page() {
	const token = cookies().get("token")?.value;

	try {
		// fetch the poi types on the server side.
		const poiTypes = token ? await getAllPOITypes(token) : [];
		const tracks = token ? await getTrackList(token) : [];

		return (
			<>
				{!token && <LoginDialog>Sie müssen sich anmelden!</LoginDialog>}
				<POIManagement {...{ poiTypes, tracks }} noFetch={token == undefined} />
			</>
		);
	} catch (e) {
		return <ExceptionMessage error={e} />;
	}
}
