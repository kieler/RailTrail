"use client";

import { useRouter } from "next/navigation";
import { FormEventHandler, PropsWithChildren, Suspense, useEffect, useRef, useState } from "react";

import Footer from "@/app/components/footer";
import { ErrorMessage } from "@/app/management/components/errorMessage";

/**
 * The Login form for this web application.
 * @param signup  Parameter indicating whether this is a signup form (temporary, remove once disabled in the backend)
 * @param setLogin Callback to set the login state to true if the login was successful. router.refresh() will be called if this is undefined.
 */
export default function Login({ setLogin }: { setLogin?: (logged_in: boolean) => void }) {
	const [error, setError] = useState(undefined as undefined | string);
	const router = useRouter();

	const do_log_in: FormEventHandler<HTMLFormElement> = e => {
		e.preventDefault();
		const data = new FormData(e.currentTarget);
		const username = data.get("username");
		const password = data.get("password");

		const loginPayload = { username, password };

		fetch("/webapi/auth", {
			body: JSON.stringify(loginPayload),
			method: "POST",
			headers: {
				accept: "application/json",
				"content-type": "application/json"
			}
		}).then(response => {
			switch (response.status) {
				case 200:
					if (setLogin != undefined) {
						setLogin(true);
					}
					// call router.refresh to refresh the header.
					router.refresh();
					break;
				case 401:
					setError("Nutzername oder Passwort falsch");
					break;
				case 502:
					setError("Konnte nicht mit Datenbank kommunizieren");
					break;
				default:
					setError(`${response.status}: ${response.statusText}`);
			}
		});
	};

	return (
		<form onSubmit={do_log_in} className="grid grid-cols-8 gap-y-1 my-1.5 items-center">
			<label htmlFor="username" className="col-span-3">
				Username:
			</label>
			<input
				type="text"
				id="username"
				name="username"
				className="border border-gray-500 dark:bg-slate-700 rounded col-span-5"
				autoFocus={true}
			/>
			<label htmlFor="password" className="col-span-3">
				Passwort:
			</label>
			<input
				type="password"
				id="password"
				name="password"
				className="border border-gray-500 dark:bg-slate-700 rounded col-span-5"
			/>
			<ErrorMessage error={error} />
			<button
				type="submit"
				className="col-span-8 rounded-full bg-slate-700 text-white dark:bg-slate-200 dark:text-black mt-1.5">
				Einloggen
			</button>
		</form>
	);
}

/**
 * The login form wrapped in a html dialog, for easy display in a modal way.
 * @param dst_url  The URL where to redirect to when the login was successful or failed.
 * @param setLogin function to call if login was/wasn't successful.
 * @param children HTML elements to display over the login form in the dialog, for example for explanations.
 */
export function LoginDialog({ setLogin, children }: PropsWithChildren<{ setLogin?: (success: boolean) => void }>) {
	const dialogRef = useRef(null as HTMLDialogElement | null);

	useEffect(() => {
		if (!dialogRef.current?.open) {
			dialogRef.current?.showModal();
		}
	});

	return (
		<dialog
			ref={dialogRef}
			onCancel={event => {
				event.preventDefault();
			}}
			className="drop-shadow-xl shadow-black bg-white dark:bg-slate-800 p-4 rounded max-w-2xl w-full dark:text-white backdrop:bg-gray-200/30 backdrop:backdrop-blur">
			{children}
			<Suspense>
				<Login setLogin={setLogin} />
			</Suspense>
			<Footer />
		</dialog>
	);
}
