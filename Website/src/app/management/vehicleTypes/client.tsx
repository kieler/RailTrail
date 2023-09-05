"use client";

/*
This is a co-located client-component. It is not in the components folder, because it is unlikely to be useful anywhere
else, but also not in ´page.tsx` as we need to obtain the currently selected track id on the server.
 */

import { ChangeEventHandler, useState } from "react";
import useSWR from "swr";
import { RevalidateError } from "@/utils/types";
import { UpdateVehicleType, VehicleType } from "@/utils/api";
import { nanToUndefined } from "@/utils/helpers";
import { ErrorMessage } from "@/app/management/components/errorMessage";
import ManagementForm from "@/app/management/components/managementForm";

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

export default function VehicleTypeManagement({ noFetch = false }: { noFetch?: boolean }) {
	// fetch Vehicle information with swr.
	const { data: vehicleTypeList, error: err, mutate } = useSWR(noFetch ? null : "/webapi/vehicleTypes/list", fetcher);

	// Form states
	const [selType, setSelType] = useState("");
	const [typeName, setTypeName] = useState("");
	const [typeIcon, setTypeIcon] = useState("");
	const [typeDescription, setTypeDescription] = useState("");
	/** modified: A "dirty flag" to prevent loosing information. */
	const [modified, setModified] = useState(false);

	// This form needs to be a "controlled form" (React lingo), as the contents of the form are updated
	// whenever a different vehicle type is selected.

	// derived things from form state
	const selectedType = vehicleTypeList?.find(type => `${type.id}` == selType);
	const delete_confirmation_msg = `Möchten Sie den Fahrzeugtyp ${selectedType?.name} wirklich entfernen?`;
	const delete_url = `/webapi/vehicleTypes/delete/${selType}`;

	const creating = selType === "";

	const create_update_url = creating ? `/webapi/vehicleTypes/create` : `/webapi/vehicleTypes/update/${selType}`;
	const create_update_payload: UpdateVehicleType & { id?: number } = {
		id: creating ? undefined : Number.parseInt(selType, 10),
		name: typeName,
		icon: typeIcon,
		description: typeDescription || undefined
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
			? vehicleTypeList.find(type => type.id == Number.parseInt(e.target.value, 10))
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
		<ManagementForm<UpdateVehicleType>
			mutate_fkt={mutate}
			{...{
				delete_url,
				delete_confirmation_msg,
				create_update_url,
				create_update_payload,
				setModified,
				creating
			}}>
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

			<ErrorMessage error={err?.message} />
		</ManagementForm>
	);
}
