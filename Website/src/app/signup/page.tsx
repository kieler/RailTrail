"use client";

import Login from "@/app/components/login";
import { FormWrapper } from "@/app/components/form";
import { useState } from "react";
import Link from "next/link";

/**
 * DO NOT USE. Will probably stop working, as progress on the backend continues.
 */
export default function SignupPage() {
	const [login, setLogin] = useState(false);

	return (
		<FormWrapper>
			{login ? (
				<div className="transition ease-in col-span-8 bg-green-300 border-green-600 text-black rounded p-2 text-center">
					<div>Erfolgreich erstellt.</div>
					<Link className={"rounded-full bg-gray-700 px-10 text-white no-a-style"} href={"/"}>
						Zurück zur Hauptseite
					</Link>
				</div>
			) : (
				<>
					<p>Bitte geben Sie Username und Passwort des Kontos an, welches Sie anlegen möchten</p>
					<Login signup={true} setLogin={setLogin} />
				</>
			)}
		</FormWrapper>
	);
}
