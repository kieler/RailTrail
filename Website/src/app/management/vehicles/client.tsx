"use client";

/*
This is a co-located client-component. It is not in the components folder, because it is unlikely to be useful anywhere
else, but also not in ´page.tsx` as we need to obtain the currently selected track id on the server.
 */

import { ChangeEventHandler, FormEventHandler, MouseEventHandler, useRef, useState } from "react";
import useSWR from "swr";
import { RevalidateError } from "@/utils/types";
import { BareTrack, Tracker, UpdateVehicle, Vehicle, VehicleType } from "@/utils/api";
import { nanToUndefined } from "@/utils/helpers";
import assert from "assert";
import { SuccessMessage } from "@/app/management/components/successMessage";
import { ErrorMessage } from "@/app/management/components/errorMessage";
import { SubmitButtons } from "@/app/management/components/submitButtons";
import { InputWithLabel } from "@/app/management/components/inputWithLabel";
import { ReferencedObjectSelect } from "@/app/management/components/referencedObjectSelect";

// The function SWR uses to request a list of vehicles
const fetcher = async (url: string) => {
	const res = await fetch(url, { method: "GET" });
	if (!res.ok) {
		// console.log('not ok!');
		throw new RevalidateError("Re-Fetching unsuccessful", res.status);
	}
	const res_2: Vehicle[] = await res.json();
	// Add a placeholder vehicle, used for adding a new one.
	res_2.unshift({ id: NaN, track: NaN, name: "[Neues Fahrzeug hinzufügen]", type: NaN, trackerIds: [] });
	return res_2;
};

function DeleteIcon(props: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height="24"
			viewBox="0 -960 960 960"
			width="24"
			className={props.className}
			fill={"currentColor"}>
			<path d="M280-120q-33 0-56.5-23.5T200-200v-520q-17 0-28.5-11.5T160-760q0-17 11.5-28.5T200-800h160q0-17 11.5-28.5T400-840h160q17 0 28.5 11.5T600-800h160q17 0 28.5 11.5T800-760q0 17-11.5 28.5T760-720v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
		</svg>
	);
}

export default function VehicleManagement({
	vehicleTypes,
	tracks,
	trackers
}: {
	vehicleTypes: VehicleType[];
	tracks: BareTrack[];
	trackers: Tracker[];
}) {
	// fetch Vehicle information with swr.
	const { data: vehicleList, error: err, isLoading, mutate } = useSWR("/webapi/vehicles/list/", fetcher);

	// TODO: handle fetching errors
	assert(!err);

	// Form states
	const [selVehicle, setSelVehicle] = useState("");
	const [vehicName, setVehicName] = useState("");
	const [vehicTrack, setVehicTrack] = useState(null as number | null);
	const [vehicType, setVehicType] = useState(null as number | null);
	const [vehicTrackers, setVehicTrackers] = useState([""]);
	/** modified: A "dirty flag" to prevent loosing information. */
	const [modified, setModified] = useState(false);

	// This form needs to be a "controlled form" (React lingo), as the contents of the form are updated
	// whenever a different vehicle is selected.

	// Form submission state
	const formRef = useRef(null as null | HTMLFormElement);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState(undefined as string | undefined);

	// Form submission function
	const updateVehicle: FormEventHandler = async e => {
		e.preventDefault();
		if (vehicTrack == null) {
			setError("Bitte wählen Sie eine Strecke aus!");
			return;
		}
		if (vehicType == null) {
			setError("Bitte wählen Sie einen Typ aus!");
			return;
		}

		// create the corresponding payload to send to the backend.
		// When adding a new vehicle, uid should be undefined, and `selVehicle` should be an empty string
		const updatePayload: UpdateVehicle = {
			track: vehicTrack,
			name: vehicName,
			type: vehicType,
			trackerIds: vehicTrackers
		};

		console.log("updatePayload", updatePayload);

		try {
			// Send the payload to our own proxy-API. Create if the selected ID is empty.
			const result =
				selVehicle !== ""
					? await fetch(`/webapi/vehicles/update/${selVehicle}`, {
							method: "put",
							body: JSON.stringify(updatePayload),
							headers: {
								accept: "application/json",
								"content-type": "application/json"
							}
					  })
					: await fetch(`/webapi/vehicles/create`, {
							method: "post",
							body: JSON.stringify(updatePayload),
							headers: {
								accept: "application/json",
								"content-type": "application/json"
							}
					  });
			// and set state based on the response
			if (result.ok) {
				setSuccess(true);
				setError(undefined);
				// invalidate cached result for key ['/webapi/vehicles/list/', trackID]
				await mutate();
			} else {
				if (result.status == 401) setError("Authorisierungsfehler: Sind Sie angemeldet?");
				if (result.status >= 500 && result.status < 600)
					setError(`Serverfehler ${result.status} ${result.statusText}`);
			}
		} catch (e) {
			setError(`Connection Error: ${e}`);
		}
	};

	const deleteVehicle: FormEventHandler = async e => {
		e.preventDefault();
		const vehicle = vehicleList && getVehicleByUid(vehicleList, Number.parseInt(selVehicle, 10));

		// Ask the user for confirmation that they indeed want to delete the vehicle
		const confirmation = confirm(`Möchten Sie das Fahrzeug ${vehicle?.name} wirklich entfernen?`);

		if (confirmation) {
			try {
				// send the deletion request to our proxy-API
				const result = await fetch(`/webapi/vehicles/delete/${selVehicle}`, {
					method: "DELETE"
				});

				// and set state based on the response
				if (result.ok) {
					await mutate();
					setSuccess(true);
					setError(undefined);
					// invalidate cached result for key ['/webapi/vehicles/list/', trackID]
				} else {
					if (result.status == 401) setError("Authorisierungsfehler: Sind Sie angemeldet?");
					if (result.status >= 500 && result.status < 600)
						setError(`Serverfehler ${result.status} ${result.statusText}`);
				}
			} catch (e) {
				setError(`Connection Error: ${e}`);
			}
		}
	};

	// select different vehicle function

	const getVehicleByUid = (vehicleList: Vehicle[], uid: number) => vehicleList.find(vehicle => vehicle.id == uid);

	const selectVehicle: ChangeEventHandler<HTMLSelectElement> = e => {
		e.preventDefault();
		console.log(e.target.value, typeof e.target.value);
		// if a different vehicle is selected, and the form data is "dirty", ask the user if they really want to overwrite their changes
		if (modified) {
			if (e.target.value != selVehicle) {
				const confirmation = confirm(
					"Möchten Sie wirklich ein anderes Fahrzeug wählen? Ihre aktuellen Änderungen gehen verloren!"
				);
				if (!confirmation) return;
			} else return;
		}
		// get the selected vehicle from the vehicle list
		const selectedVehicle = vehicleList
			? getVehicleByUid(vehicleList, Number.parseInt(e.target.value, 10))
			: undefined;
		setSelVehicle(e.target.value);
		// And set the form values to the properties of the newly selected vehicle
		setVehicName(selectedVehicle?.name ?? "");
		setVehicTrack(selectedVehicle?.track ?? null);
		setVehicType(selectedVehicle?.type ?? null);
		setVehicTrackers(selectedVehicle?.trackerIds ?? [""]);
		// Also reset the "dirty flag"
		setModified(false);
	};

	// tracker related functions

	/** Add a new field for another tracker */
	const addTracker: MouseEventHandler<HTMLButtonElement> = e => {
		e.preventDefault();
		// We need to create a new list, otherwise React will be unhappy.
		const newTrackerList = vehicTrackers.concat([""]);
		setVehicTrackers(newTrackerList);
	};

	/** Change the value of a specific tracker. */
	const updateTracker = (target_idx: number, target_val: string) => {
		// We need to create a new list, otherwise React will be unhappy.
		// This could be done using the recently introduced Array.prototype.with() function,
		const newTrackerList = vehicTrackers.map((list_val, list_idx) =>
			list_idx == target_idx ? target_val : list_val
		);
		setVehicTrackers(newTrackerList);
	};

	/** Remove a specific tracker. */
	const removeTracker = (target_idx: number) => {
		// We need to create a new list, otherwise React will be unhappy.
		const newTrackerList = vehicTrackers.filter((_, list_idx) => list_idx != target_idx);
		setVehicTrackers(newTrackerList);
	};

	// Note: the onChange event for the inputs is needed as this is a controlled form. Se React documentation
	return (
		<>
			<form onSubmit={updateVehicle} ref={formRef} className={"grid grid-cols-8 gap-y-2 mx-1.5 items-center"}>
				{
					/* Display a success message if the success flag is true */ success ? (
						<SuccessMessage {...{ setSuccess, setModified }} />
					) : (
						<>
							<label htmlFor={"selVehicle"} className={"col-span-3"}>
								Fahrzeug:
							</label>
							<select
								value={selVehicle}
								onChange={selectVehicle}
								id={"selVehicle"}
								name={"selVehicle"}
								className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded">
								{/* Create an option for each vehicle in the vehicle list */
								vehicleList?.map(v => (
									<option key={v.id} value={nanToUndefined(v.id) ?? ""}>
										{v.name}
									</option>
								))}
							</select>
							<InputWithLabel
								value={vehicName}
								id={"vehicName"}
								name={"vehicName"}
								setValue={setVehicName}
								setModified={setModified}>
								Name:
							</InputWithLabel>

							<ReferencedObjectSelect
								value={vehicTrack}
								inputId={"vehicTrack"}
								name={"vehicTrack"}
								setValue={setVehicTrack}
								setModified={setModified}
								objects={tracks}
								mappingFunction={t => ({ value: t.id, label: `${t.start}\u2013${t.end}` })}>
								Strecke:
							</ReferencedObjectSelect>

							<ReferencedObjectSelect
								value={vehicType}
								inputId={"vehicType"}
								name={"vehicType"}
								setValue={setVehicType}
								setModified={setModified}
								objects={vehicleTypes}
								mappingFunction={type => ({
									value: type.id,
									label: type.name
								})}>
								Fahrzeugart:
							</ReferencedObjectSelect>
							{
								/* Convoluted code to allow for multiple tracker entries. Essentially, for each tracker input,
                    there is a corresponding field in the tracker state tuple.
                    Which is then mapped to produce a label, an input, and a remove button for this tracker entry */
								vehicTrackers.map((uid, idx) => (
									<>
										<ReferencedObjectSelect
											name={"vehicTrackers"}
											inputId={`vehicTracker${idx}`}
											value={uid}
											objects={trackers}
											mappingFunction={t => ({ value: t.id, label: t.id })}
											setValue={newValue => updateTracker(idx, newValue)}
											setModified={setModified}
											width={4}>
											{idx == 0 ? (
												/*Only the first tracker gets a visible label. Every other is only for screen readers.*/
												<>
													Tracker<span className="sr-only"> Nummer {`${idx + 1}`}</span>:
												</>
											) : (
												<span className="sr-only">Tracker Nummer {`${idx + 1}`}: </span>
											)}
										</ReferencedObjectSelect>
										<button
											className={
												"col-span-1 border border-gray-500 dark:bg-slate-700 rounded h-full ml-4 content-center"
											}
											type={"button"}
											onClick={() => removeTracker(idx)}>
											<DeleteIcon className={"m-auto"} />
										</button>
									</>
								))
							}
							<div className={"col-span-3"} />
							{/* Also offer a button to add another tracker entry */}
							<button
								className={
									"col-span-5 border border-gray-500 dark:bg-slate-700 rounded h-full content-center"
								}
								type={"button"}
								onClick={addTracker}>
								Tracker hinzufügen
							</button>
						</>
					)
				}
				<ErrorMessage error={error} />
				{!success && !isLoading && <SubmitButtons creating={selVehicle === ""} onDelete={deleteVehicle} />}
			</form>
		</>
	);
}
