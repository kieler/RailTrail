"use client";

import Login from "@/app/components/login";
import { FormWrapper } from "@/app/components/form";
import Link from "next/link";
import { useState } from "react";

/**
 * The stand-alone login page
 */
export default function LoginPage() {
	const [login, setLogin] = useState(false);

	return (
		<FormWrapper>
			{login ? (
				<div className="transition ease-in col-span-8 bg-green-300 border-green-600 text-black rounded p-2 text-center">
					<div>Erfolgreich eingeloggt.</div>
					<Link className={"rounded-full bg-gray-700 px-10 text-white no-a-style"} href={"/"}>
						Zurück zur Hauptseite
					</Link>
				</div>
			) : (
				<Login setLogin={setLogin} />
			)}
		</FormWrapper>
	);
}
