"use client";

import { getFetcher } from "@/utils/fetcher";
import useSWR from "swr";
import dynamic from "next/dynamic";
import { ErrorMessage } from "@/app/management/components/errorMessage";
import { useState } from "react";
import { InputWithLabel } from "@/app/management/components/inputWithLabel";
import { AuthenticationRequest } from "@/utils/api.website";
import { SuccessMessage } from "@/app/management/components/successMessage";
import LoadMapScreen from "@/app/components/loadmap";
import { BaseManagementForm } from "@/app/management/components/managementForm";

const DynamicDeleteUser = dynamic(() => import("@/app/management/users/deleteUser"), {
	loading: () => (
		<div className={"h-24 w-full"}>
			<LoadMapScreen />
		</div>
	)
});

/**
 * Wrapper for forms for managing other users
 * @param noFetch    Flag indicating whether to attempt to fetch data
 */
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

/**
 * Form to add a new user
 * @param mutateUserList	Function to indicate that the user list might have changed on the backend
 */
function AddUser({ mutateUserList }: { mutateUserList: () => Promise<void> }) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const [success, setSuccess] = useState(false);
	const [error, setError] = useState(undefined as string | undefined);

	// state derived things for the management form component
	const submit_invalid_msg =
		username == ""
			? "Username darf nicht leer sein!"
			: password == ""
			? "Passwort darf nicht leer sein!"
			: undefined;

	const payload: AuthenticationRequest = { username, password };
	const submit_url = "/webapi/user/create";

	return (
		<>
			{success ? (
				<SuccessMessage setSuccess={setSuccess} setModified={() => {}} />
			) : (
				<BaseManagementForm
					setSuccess={setSuccess}
					setError={setError}
					submit_invalid_msg={submit_invalid_msg}
					submit_payload={payload}
					submit_url={submit_url}
					submit_method={"POST"}
					mutate_fkt={mutateUserList}>
					<InputWithLabel
						id={"createUsername"}
						name={"createUsername"}
						value={username}
						setValue={setUsername}>
						Username:
					</InputWithLabel>

					<InputWithLabel
						id={"createPassword"}
						name={"createPassword"}
						value={password}
						setValue={setPassword}
						type={"password"}>
						Passwort:
					</InputWithLabel>

					<ErrorMessage error={error} />

					<button
						type={"submit"}
						className="col-span-8 rounded-full bg-gray-700 text-white"
						disabled={username == null}>
						Hinzufügen
					</button>
				</BaseManagementForm>
			)}
		</>
	);
}
