"use client";

import { useContext } from "react";
import { UsernameContext } from "@/app/components/username-provider";
import Link from "next/link";

/**
 * A component showing the name of the currently logged-in user, with a logout link,
 * or a login link if the user is not logged-in.
 */
export function CurrentUser({ className }: { className?: string }) {
	const username = useContext(UsernameContext);

	return (
		<>
			{username ? (
				<div className={className}>
					Hello {username} &ndash;{" "}
					<Link href={"/logout"} prefetch={false}>
						Logout
					</Link>
				</div>
			) : (
				<div className={className}>
					<Link href={"/login"}>Login</Link>
				</div>
			)}
		</>
	);
}
