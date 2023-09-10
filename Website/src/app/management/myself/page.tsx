import { cookies } from "next/headers";
import { LoginDialog } from "@/app/components/login";
import CurrentUserManagement from "@/app/management/myself/client";

export default function Page() {
	const hasToken = cookies().has("token");

	return (
		<>
			{!hasToken && <LoginDialog>Sie müssen sich anmelden!</LoginDialog>}
			<CurrentUserManagement />
		</>
	);
}
