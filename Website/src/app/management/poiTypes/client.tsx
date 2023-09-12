"use client";

/*
This is a co-located client-component. It is not in the components folder, because it is unlikely to be useful anywhere
else, but also not in ´page.tsx` as we need to obtain the currently selected track id on the server.
 */

import { useState } from "react";
import useSWR from "swr";
import { Option } from "@/utils/types";
import { CreatePOIType, POITypeIcon } from "@/utils/api";
import { Options, SingleValue } from "react-select";
import IconSelection from "@/app/management/components/iconSelection";
import { getFetcher } from "@/utils/fetcher";
import { ErrorMessage } from "@/app/management/components/errorMessage";
import StyledSelect from "@/app/management/components/styledSelect";
import { InputWithLabel } from "@/app/management/components/inputWithLabel";
import ManagementForm from "@/app/management/components/managementForm";

export default function POITypeManagement({ noFetch = false }: { noFetch?: boolean }) {
	// fetch Vehicle information with swr.
	const {
		data: poiTypeList,
		error: err,
		mutate
	} = useSWR(noFetch ? null : "/webapi/poiTypes/list", getFetcher<"/webapi/poiTypes/list">);

	// react-select foo
	// Add a placeholder poiOption, used for adding a new one.
	const addOption: Option<number | ""> = { value: "", label: "[Neue Interessenspunktart hinzufügen]" };
	const poiTypeOptions: Options<Option<number | "">> = [
		addOption,
		...(poiTypeList?.map(t => ({
			value: t.id,
			label: t.name
		})) ?? [])
	];

	// Form states
	const [selType, setSelType] = useState(addOption);
	const [typeName, setTypeName] = useState("");
	const [typeIcon, setTypeIcon] = useState("" as POITypeIcon | "");
	const [typeDescription, setTypeDescription] = useState("");
	/** modified: A "dirty flag" to prevent loosing information. */
	const [modified, setModified] = useState(false);

	// This form needs to be a "controlled form" (React lingo), as the contents of the form are updated
	// whenever a different poi type is selected.

	// derived things from form state
	const selectedType = poiTypeList && poiTypeList.find(poi => poi.id == selType.value);
	const delete_confirmation_msg = `Möchten Sie den Interessenspunkttyp ${selectedType?.name} wirklich entfernen?`;
	const delete_url = `/webapi/poiTypes/delete/${selType.value}`;

	const creating = selType.value === "";
	const iconSelected = typeIcon !== "";
	const update_invalid_msg = iconSelected ? undefined : "Bitte wählen Sie ein Icon aus!";

	const create_update_url = creating ? `/webapi/poiTypes/create` : `/webapi/poiTypes/update/${selType.value}`;
	const create_update_payload: (CreatePOIType & { id?: number }) | undefined = iconSelected
		? {
				id: selType.value === "" ? undefined : selType.value,
				name: typeName,
				icon: typeIcon,
				description: typeDescription || undefined
		  }
		: undefined;

	// select different vehicle type function
	const selectType = (newValue: SingleValue<Option<number | "">>) => {
		if (!newValue) {
			return;
		}
		// if a different vehicle type is selected, and the form data is "dirty", ask the user if they really want to overwrite their changes
		if (modified) {
			if (newValue.value != selType.value) {
				const confirmation = confirm(
					"Möchten Sie wirklich eine andere Fahrzeugart wählen? Ihre aktuellen Änderungen gehen verloren!"
				);
				if (!confirmation) return;
			} else return;
		}
		// get the selected vehicle type from the vehicle type list
		const selectedType = poiTypeList?.find(t => t.id == newValue.value);

		setSelType(newValue);
		// And set the form values to the properties of the newly selected vehicle type
		setTypeName(selectedType?.name ?? "");
		setTypeIcon(selectedType?.icon ?? "");
		setTypeDescription("" + (selectedType?.description ?? ""));
		setModified(false);
	};

	// Note: the onChange event for the inputs is needed as this is a controlled form. Se React documentation
	return (
		<ManagementForm<CreatePOIType & { id?: number }>
			mutate_fkt={mutate}
			{...{
				delete_url,
				delete_confirmation_msg,
				create_update_url,
				create_update_payload,
				setModified,
				creating,
				update_invalid_msg
			}}>
			<label htmlFor={"selType"} className={"col-span-3"}>
				Interessenspunktart:
			</label>
			<StyledSelect
				value={selType}
				onChange={selectType}
				id={"selType"}
				name={"selType"}
				options={poiTypeOptions}
			/>
			<InputWithLabel
				value={typeName}
				id={"typeName"}
				name={"typeName"}
				setModified={setModified}
				setValue={setTypeName}>
				Name:
			</InputWithLabel>
			<label htmlFor={"typeIcon"} className={"col-span-3"}>
				Icon:
			</label>
			<IconSelection
				currentIcon={typeIcon}
				id={"typeIcon"}
				name={"typeIcon"}
				setIcon={setTypeIcon}
				setModified={setModified}
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
