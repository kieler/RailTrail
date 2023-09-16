"use client";

import { useContext, useState } from "react";
import { LoginDialog } from "@/app/components/login";
import Link from "next/link";
import { ChangePassword, ChangeUsername } from "@/app/management/myself/client";
import { UsernameContext } from "@/app/components/username-provider";

/**
 * Page component containing both forms for user management
 */
export default function SelfManagement() {
	const [success, setSuccess] = useState(false);

	// we can determine if the user is logged in by looking at the username
	const username = useContext(UsernameContext);
	// If the username is undefined, the user is not logged in.
	const loggedIn = username !== undefined;

	return (
		<>
			{!loggedIn && !success && <LoginDialog>Sie müssen sich anmelden!</LoginDialog>}
			{success ? (
				<div className="transition ease-in col-span-8 bg-green-300 border-green-600 text-black rounded p-2 text-center">
					<div>Änderungen erfolgreich durchgeführt</div>
					<div>Sie wurden durch die Änderung ausgeloggt.</div>
					<Link className={"rounded-full bg-gray-700 px-10 text-white no-a-style"} href={"/login"}>
						Erneut einloggen
					</Link>
				</div>
			) : (
				<>
					<div>Usernamen ändern:</div>
					<ChangeUsername setSuccess={setSuccess} />
					<div className={"my-20"} />
					<div>Passwort ändern:</div>
					<ChangePassword setSuccess={setSuccess} />
				</>
			)}
		</>
	);
}
