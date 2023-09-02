"use client";

/*
This is a co-located client-component. It is not in the components folder, because it is unlikely to be useful anywhere
else, but also not in ´page.tsx` as we need to obtain the currently selected track id on the server.
 */

import { ChangeEventHandler, FormEventHandler, useRef, useState } from "react";
import useSWR from "swr";
import { RevalidateError } from "@/utils/types";
import { UpdateVehicleType, VehicleType } from "@/utils/api";
import { nanToUndefined } from "@/utils/helpers";
import assert from "assert";
import { SuccessMessage } from "@/app/management/components/successMessage";
import { ErrorMessage } from "@/app/management/components/errorMessage";
import { SubmitButtons } from "@/app/management/components/submitButtons";

// The function SWR uses to request a list of vehicles
const fetcher = async (url: string) => {
	const res = await fetch(url, { method: "GET" });
	if (!res.ok) {
		// console.log('not ok!');
		throw new RevalidateError("Re-Fetching unsuccessful", res.status);
	}
	const res_2: VehicleType[] = await res.json();
	// Add a placeholder vehicle, used for adding a new one.
	res_2.push({ id: NaN, icon: "", name: "[Neue Fahrzeugart hinzufügen]" });
	return res_2;
};

export default function VehicleTypeManagement() {
	// fetch Vehicle information with swr.
	const { data: vehicleTypeList, error: err, isLoading, mutate } = useSWR("/webapi/vehicleTypes/list", fetcher);

	// TODO: handle fetching errors
	assert(!err);

	// Form states
	const [selType, setSelType] = useState("");
	const [typeName, setTypeName] = useState("");
	const [typeIcon, setTypeIcon] = useState("");
	const [typeDescription, setTypeDescription] = useState("");
	/** modified: A "dirty flag" to prevent loosing information. */
	const [modified, setModified] = useState(false);

	// This form needs to be a "controlled form" (React lingo), as the contents of the form are updated
	// whenever a different vehicle type is selected.

	// Form submission state
	const formRef = useRef(null as null | HTMLFormElement);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState(undefined as string | undefined);

	// Form submission function
	const updateType: FormEventHandler = async e => {
		e.preventDefault();
		// create the corresponding payload to send to the backend.
		// When adding a new vehicle type, uid should be undefined, and `selType` should be an empty string
		const createPayload: UpdateVehicleType = {
			name: typeName,
			icon: typeIcon,
			description: typeDescription || undefined
		};

		const updatePayload: VehicleType = {
			id: Number.parseInt(selType, 10),
			name: typeName,
			icon: typeIcon,
			description: typeDescription || undefined
		};

		console.log("updatePayload", updatePayload);

		try {
			// Send the payload to our own proxy-API
			const result =
				selType === ""
					? await fetch(`/webapi/vehicleTypes/create`, {
							method: "post",
							body: JSON.stringify(createPayload),
							headers: {
								Accept: "application/json",
								"Content-Type": "application/json"
							}
					  })
					: await fetch(`/webapi/vehicleTypes/update/${selType}`, {
							method: "put",
							body: JSON.stringify(updatePayload),
							headers: {
								Accept: "application/json",
								"Content-Type": "application/json"
							}
					  });
			// and set state based on the response
			if (result.ok) {
				setSuccess(true);
				setError(undefined);
				// tell swr that the data on the server has probably changed.
				mutate();
			} else {
				if (result.status == 401) setError("Authorisierungsfehler: Sind Sie angemeldet?");
				if (result.status >= 500 && result.status < 600)
					setError(`Serverfehler ${result.status} ${result.statusText}`);
			}
		} catch (e) {
			setError(`Connection Error: ${e}`);
		}
	};
	const getTypeByUid = (vehicleTypeList: VehicleType[], uid: number) => vehicleTypeList.find(type => type.id == uid);

	const deleteType: FormEventHandler = e => {
		e.preventDefault();
		const type = vehicleTypeList && getTypeByUid(vehicleTypeList, Number.parseInt(selType, 10));

		// Ask the user for confirmation that they indeed want to delete the vehicle
		const confirmation = confirm(`Möchten Sie den Fahrzeugtyp ${type?.name} wirklich entfernen?`);

		if (confirmation) {
			// send the deletion request to our proxy-API
			fetch(`/webapi/vehicleTypes/delete/${selType}`, {
				method: "DELETE"
			})
				.then(result => {
					// and set state based on the response
					if (result.ok) {
						// invalidate cached result for key ['/webapi/vehicles/list/', trackID]
						mutate().then(() => {
							setSuccess(true);
							setError(undefined);
						});
					} else {
						if (result.status == 401) setError("Authorisierungsfehler: Sind Sie angemeldet?");
						if (result.status >= 500 && result.status < 600)
							setError(`Serverfehler ${result.status} ${result.statusText}`);
					}
				})
				.catch(e => {
					setError(`Connection Error: ${e}`);
				});
		}
	};

	// select different vehicle type function
	const selectType: ChangeEventHandler<HTMLSelectElement> = e => {
		e.preventDefault();
		// if a different vehicle type is selected, and the form data is "dirty", ask the user if they really want to overwrite their changes
		if (modified) {
			if (e.target.value != selType) {
				const confirmation = confirm(
					"Möchten Sie wirklich eine andere Fahrzeugart wählen? Ihre aktuellen Änderungen gehen verloren!"
				);
				if (!confirmation) return;
			} else return;
		}
		// get the selected vehicle type from the vehicle type list
		const selectedType = vehicleTypeList
			? getTypeByUid(vehicleTypeList, Number.parseInt(e.target.value, 10))
			: undefined;
		setSelType(e.target.value);
		// And set the form values to the properties of the newly selected vehicle type
		setTypeName(selectedType?.name ?? "");
		setTypeIcon(selectedType?.icon ?? "");
		setTypeDescription("" + (selectedType?.description ?? ""));
		setModified(false);
	};

	// Note: the onChange event for the inputs is needed as this is a controlled form. Se React documentation
	return (
		<form onSubmit={updateType} ref={formRef} className={"grid grid-cols-8 gap-y-2 mx-1.5 items-center"}>
			{
				/* Display a success message if the success flag is true */ success ? (
					<SuccessMessage {...{ setSuccess, setModified }} />
				) : (
					<>
						<label htmlFor={"selType"} className={"col-span-3"}>
							Fahrzeugart:
						</label>
						<select
							value={selType}
							onChange={selectType}
							id={"selType"}
							name={"selType"}
							className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded">
							{/* Create an option for each vehicle type in the vehicle type list */
							vehicleTypeList?.map(v => (
								<option key={v.id} value={nanToUndefined(v.id) ?? ""}>
									{v.name}
								</option>
							))}
						</select>
						<label htmlFor={"typeName"} className={"col-span-3"}>
							Name:
						</label>
						<input
							value={typeName}
							id={"typeName"}
							name={"typeName"}
							className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
							onChange={e => {
								setTypeName(e.target.value);
								setModified(true);
							}}
						/>
						<label htmlFor={"typeIcon"} className={"col-span-3"}>
							Icon:
						</label>
						<input
							value={typeIcon}
							id={"typeIcon"}
							name={"typeIcon"}
							className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
							onChange={e => {
								setTypeIcon(e.target.value);
								setModified(true);
							}}
						/>
						<label htmlFor={"typeDescription"} className={"col-span-3"}>
							Beschreibung:
						</label>
						<textarea
							value={typeDescription}
							id={"typeDescription"}
							name={"typeDescription"}
							className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
							onChange={e => {
								setTypeDescription(e.target.value);
								setModified(true);
							}}
						/>
						<ErrorMessage error={error} />
						{!success && !isLoading && <SubmitButtons creating={selType === ""} onDelete={deleteType} />}
					</>
				)
			}
		</form>
	);
}
