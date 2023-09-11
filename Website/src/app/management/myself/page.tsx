import { cookies } from "next/headers";
import SelfManagement from "@/app/management/myself/client";

export default function Page() {
	const hasToken = cookies().has("token");

	return <SelfManagement loggedIn={hasToken} />;
}
