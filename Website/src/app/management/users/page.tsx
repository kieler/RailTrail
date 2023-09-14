import UserManagement from "@/app/management/users/client";
import { cookies } from "next/headers";
import { LoginDialog } from "@/app/components/login";

/**
 * The server side things for the user management page
 */
export default function Page() {
	const hasToken = cookies().has("token");

	return (
		<>
			{!hasToken && <LoginDialog>Sie müssen sich anmelden!</LoginDialog>}
			<UserManagement noFetch={!hasToken} />
		</>
	);
}
