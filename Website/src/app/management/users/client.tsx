"use client";

import { getFetcher } from "@/utils/fetcher";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { ErrorMessage } from "@/app/management/components/errorMessage";
import { FormEventHandler, useState } from "react";
import { InputWithLabel } from "@/app/management/components/inputWithLabel";
import { AuthenticationRequest } from "@/utils/api.website";
import { SuccessMessage } from "@/app/management/components/successMessage";
import LoadMapScreen from "@/app/components/loadmap";

const DynamicDeleteUser = dynamic(() => import("@/app/management/users/deleteUser"), {
	loading: () => (
		<div className={"h-24 w-full"}>
			<LoadMapScreen />
		</div>
	)
});

export default function UserManagement({ noFetch = false }: { noFetch?: boolean }) {
	// fetch Vehicle information with swr.
	const {
		data: userList,
		error: err,
		mutate
	} = useSWR(noFetch ? null : "/webapi/user/list", getFetcher<"/webapi/user/list">);

	return (
		<>
			<p>Hinzufügen:</p>
			<AddUser mutateUserList={mutate} />
			<div className={"my-20"} />
			{userList && (
				<>
					<p>Löschen:</p>
					<DynamicDeleteUser {...{ userList, mutateUserList: mutate }} />
				</>
			)}
			<ErrorMessage error={err?.message} />
		</>
	);
}

function AddUser({ mutateUserList }: { mutateUserList: () => Promise<void> }) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const [success, setSuccess] = useState(false);
	const [error, setError] = useState(undefined as string | undefined);

	const handleResponse = async (result: Response) => {
		if (result.ok) {
			// invalidate cached result for swr
			await mutateUserList();
			setSuccess(true);
			setError(undefined);
		} else if (result.status == 401) {
			setError("Authorisierungsfehler: Sind Sie angemeldet?");
		} else if (result.status >= 500 && result.status < 600) {
			setError(`Serverfehler ${result.status} ${result.statusText}`);
		} else {
			setError(`Sonstiger Fehler ${result.status} ${result.statusText}`);
		}
	};

	const createUser: FormEventHandler = e => {
		e.preventDefault();

		// check the input for sanity
		if (username == "") {
			setError("Username darf nicht leer sein!");
			return;
		}
		if (password == "") {
			setError("Passwort darf nicht leer sein!");
			return;
		}

		// construct the user creation payload
		const payload: AuthenticationRequest = { username, password };

		// and send it to our proxy-API
		fetch("/webapi/user/create", {
			method: "post",
			body: JSON.stringify(payload),
			headers: {
				accept: "application/json",
				"content-type": "application/json"
			}
		})
			.then(handleResponse)
			.catch(e => setError(`Verbindungsfehler: ${e}`));
	};

	return (
		<>
			{" "}
			{success ? (
				<SuccessMessage setSuccess={setSuccess} setModified={() => {}} />
			) : (
				<form className={"grid grid-cols-8 gap-2 mx-1.5 items-center"} onSubmit={createUser}>
					<InputWithLabel
						id={"createUsername"}
						name={"createUsername"}
						value={username}
						setValue={setUsername}
						setModified={() => {}}>
						Username:
					</InputWithLabel>

					<InputWithLabel
						id={"createPassword"}
						name={"createPassword"}
						value={password}
						setValue={setPassword}
						setModified={() => {}}>
						Passwort:
					</InputWithLabel>

					<ErrorMessage error={error} />

					<button
						type={"submit"}
						className="col-span-8 rounded-full bg-gray-700 text-white"
						disabled={username == null}>
						Hinzufügen
					</button>
				</form>
			)}
		</>
	);
}
