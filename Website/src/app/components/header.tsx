"use client";

import Link from "next/link";
import { useContext } from "react";
import { UsernameContext } from "@/app/components/username-provider";

/**
 * The header for the web page
 */
export default function Header() {
	const username = useContext(UsernameContext);

	return (
		<header className={"flex flex-row w-full flex-initial justify-items-center p-2"}>
			<div>
				<Link href={"/"}>RailTrail Admin interface</Link>
			</div>
			<div className={"grow"} />
			{username ? (
				<div>
					Hello {username} &ndash;{" "}
					<Link href={"/logout"} prefetch={false}>
						Logout
					</Link>
				</div>
			) : (
				<div>
					<Link href={"/login"}>Login</Link>
				</div>
			)}
		</header>
	);
}
