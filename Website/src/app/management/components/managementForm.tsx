import { FormEventHandler, PropsWithChildren, useState } from "react";
import { SuccessMessage } from "@/app/management/components/successMessage";
import { ErrorMessage } from "@/app/management/components/errorMessage";
import { SubmitButtons } from "@/app/management/components/submitButtons";
import { Response } from "next/dist/compiled/@edge-runtime/primitives";

/**
 * A component handling the submission for most of the management forms, as well as success/error tracking
 * @param children                  The actual form elements
 * @param delete_confirmation_msg   A message to ask for confirmation for deletion with.
 * @param delete_url                The URL where a DELETE request shall be directed.
 * @param create_update_payload     The payload that needs to be sent to the create/update endpoint
 * @param create_update_url         The url where the above-mentioned creation/update payload shall be directed
 * @param update_invalid_msg        A message to show when trying to submit something invalid. MUST be `undefined` when the payload is valid. Will block create/update requests while non-nullish
 * @param creating                  A flag indicating whether the form is used to create an object.
 * @param setModified               A function that, when called with `false`, clears the "dirty flag" of the form
 * @param mutate_fkt                A function to indicate that the data has been modified at the backend and should be re-fetched.
 */
export default function ManagementForm<PayloadT>({
	children,
	delete_confirmation_msg,
	delete_url,
	create_update_payload,
	create_update_url,
	update_invalid_msg,
	creating,
	setModified,
	mutate_fkt
}: PropsWithChildren<{
	delete_confirmation_msg: string;
	delete_url: string;
	create_update_payload?: PayloadT;
	update_invalid_msg?: string;
	create_update_url: string;
	creating: boolean;
	setModified: (modified: boolean) => void;
	mutate_fkt: () => Promise<void>;
}>) {
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState(undefined as string | undefined);

	// Form submission function

	const handleResponse = async (result: Response) => {
		if (result.ok) {
			// invalidate cached result for swr
			await mutate_fkt();
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

	const updateThing: FormEventHandler = async e => {
		e.preventDefault();
		// create the corresponding payload to send to the backend.
		if (update_invalid_msg != undefined) {
			setError(update_invalid_msg);
			return;
		} else if (create_update_payload == undefined) {
			setError("Etwas Unerwartetes ist passiert!");
			return;
		}

		console.log("updatePayload", create_update_payload);

		try {
			const send_method = creating ? "post" : "put";
			// Send the payload to our own proxy-API. Create if the selected ID is empty.
			const result = await fetch(create_update_url, {
				method: send_method,
				body: JSON.stringify(create_update_payload),
				headers: {
					accept: "application/json",
					"content-type": "application/json"
				}
			});

			// and set state based on the response
			await handleResponse(result);
		} catch (e) {
			setError(`Verbindungsfehler: ${e}`);
		}
	};

	const deleteThing: FormEventHandler = async e => {
		e.preventDefault();

		// Ask the user for confirmation that they indeed want to delete the thing
		const confirmation = confirm(delete_confirmation_msg);

		if (confirmation) {
			try {
				// send the deletion request to our proxy-API
				const result = await fetch(delete_url, {
					method: "DELETE"
				});

				// and set state based on the response
				await handleResponse(result);
			} catch (e) {
				setError(`Verbindungsfehler: ${e}`);
			}
		}
	};

	return (
		<form onSubmit={updateThing} className={"grid grid-cols-8 gap-2 mx-1.5 items-center"}>
			{
				/* Display a success message if the success flag is true */ success ? (
					<SuccessMessage {...{ setSuccess, setModified }} />
				) : (
					<>
						{children}
						<ErrorMessage error={error} />
						<SubmitButtons creating={creating} onDelete={deleteThing} />
					</>
				)
			}
		</form>
	);
}
