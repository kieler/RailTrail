import { User } from "@/utils/api.website";
import { FormEventHandler, useState } from "react";
import ReferencedObjectSelect from "@/app/management/components/referencedObjectSelect";
import { SuccessMessage } from "@/app/management/components/successMessage";
import { ErrorMessage } from "@/app/management/components/errorMessage";

/**
 * A form to delete users
 * @param userList			List of all users on the backend
 * @param mutateUserList	Function to indicate that the user list might have changed on the backend
 */
export default function DeleteUser({
	userList,
	mutateUserList
}: {
	userList: User[];
	mutateUserList: () => Promise<void>;
}) {
	const [username, setUsername] = useState(null as null | string);

	const [success, setSuccess] = useState(false);
	const [error, setError] = useState(undefined as string | undefined);

	const delete_confirmation_msg = `Möchten Sie den Nutzer ${username} wirklich löschen?`;
	const safeUsername = username != null ? encodeURIComponent(username) : null;
	const delete_url = `/webapi/user/delete/${safeUsername}`;

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

	const deleteUser: FormEventHandler = e => {
		e.preventDefault();
		if (username == null) {
			return;
		}

		// Ask the user for confirmation that they indeed want to delete the thing
		const confirmation = confirm(delete_confirmation_msg);

		if (confirmation) {
			// send the deletion request to our proxy-API
			fetch(delete_url, {
				method: "DELETE"
			})
				.then(result =>
					// and set state based on the response
					handleResponse(result)
				)
				.catch(e => {
					// while catching possible errors
					setError(`Verbindungsfehler: ${e}`);
				});
		}
	};

	return (
		<>
			{" "}
			{success ? (
				<SuccessMessage setSuccess={setSuccess} setModified={() => {}} />
			) : (
				<form className={"grid grid-cols-8 gap-2 mx-1.5 items-center"} onSubmit={deleteUser}>
					<ReferencedObjectSelect
						inputId={"deleteUsername"}
						name={"deleteUsername"}
						value={username}
						setValue={setUsername}
						setModified={() => {}}
						objects={userList}
						mappingFunction={user => ({ value: user.username, label: user.username })}>
						Username:
					</ReferencedObjectSelect>

					<ErrorMessage error={error} />

					<button
						type={"submit"}
						className="col-span-8 rounded-full bg-gray-700 text-white"
						disabled={username == null}>
						Löschen
					</button>
				</form>
			)}
		</>
	);
}
