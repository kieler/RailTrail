"use client";
"use strict";

/*
This is a co-located client-component. It is not in the components folder, because it is unlikely to be useful anywhere
else, but also not in ´page.tsx` as we need to obtain the currently selected track id on the server.
 */

import { useState } from "react";
import useSWR from "swr";
import { BareTrack, PointOfInterest, POIType, Position, UpdatePointOfInterest } from "@/utils/api";
import L from "leaflet";
import PositionSelector from "@/app/components/form_map";
import { getFetcher } from "@/utils/fetcher";
import { Option } from "@/utils/types";
import { Options, SingleValue } from "react-select";
import { ErrorMessage } from "@/app/management/components/errorMessage";
import { InputWithLabel } from "@/app/management/components/inputWithLabel";
import { StyledSelect } from "@/app/management/components/styledSelect";
import { ReferencedObjectSelect } from "@/app/management/components/referencedObjectSelect";
import ManagementForm from "@/app/management/components/managementForm";

export default function POIManagement({
	poiTypes,
	tracks,
	noFetch = false
}: {
	poiTypes: POIType[];
	tracks: BareTrack[];
	noFetch?: boolean;
}) {
	// fetch Vehicle information with swr.
	const {
		data: poiList,
		error: err,
		mutate
	} = useSWR(noFetch ? null : "/webapi/poi/list", getFetcher<"/webapi/poi/list">);

	const initialPos: Position = { lat: 54.2333, lng: 10.6024 };

	// react-select foo
	// Add a placeholder poiOption, used for adding a new one.
	const addOption: Option<number | ""> = { value: "", label: "[Neuen Interessenspunkt hinzufügen]" };
	const poiOptions: Options<Option<number | "">> = [
		addOption,
		...(poiList?.map(t => ({
			value: t.id,
			label: t.name
		})) ?? [])
	];

	// Form states
	const [selPoi, setSelPoi] = useState(addOption);
	const [poiName, setPoiName] = useState("");
	const [poiTrack, setPoiTrack] = useState(null as null | number);
	const [poiType, setPoiType] = useState(null as null | number);
	const [poiDescription, setPoiDescription] = useState("");
	const [poiPosition, setPoiPosition] = useState(initialPos);
	/** modified: A "dirty flag" to prevent loosing information. */
	const [modified, setModified] = useState(false);

	// This form needs to be a "controlled form" (React lingo), as the contents of the form are updated
	// whenever a different poi is selected.

	// derived things from form state
	const selectedPoi = poiList && poiList.find(poi => poi.id == selPoi.value);
	const delete_confirmation_msg = `Möchten Sie den Interessenspunkt ${selectedPoi?.name} wirklich entfernen?`;
	const delete_url = `/webapi/poi/delete/${selPoi.value}`;

	const creating = selPoi.value === "";
	const trackSelected = poiTrack != null;
	const typeSelected = poiType != null;
	const update_invalid_msg = trackSelected
		? typeSelected
			? undefined
			: "Bitte wählen Sie einen Typ aus!"
		: "Bitte wählen Sie eine Strecke aus!";

	const create_update_url = creating ? `/webapi/poi/create` : `/webapi/poi/update/${selPoi.value}`;
	const create_update_payload: UpdatePointOfInterest | undefined =
		trackSelected && typeSelected
			? {
					id: selPoi.value === "" ? undefined : selPoi.value,
					isTurningPoint: false,
					pos: poiPosition,
					trackId: poiTrack,
					name: poiName,
					typeId: poiType,
					description: poiDescription
			  }
			: undefined;

	// select different poi function

	const selectPoi = (newValue: SingleValue<Option<number | "">>) => {
		if (newValue == null) return;
		// if a different vehicle is selected, and the form data is "dirty", ask the user if they really want to overwrite their changes
		if (modified) {
			if (newValue.value != selPoi.value) {
				const confirmation = confirm(
					"Möchten Sie wirklich ein anderes Fahrzeug wählen? Ihre aktuellen Änderungen gehen verloren!"
				);
				if (!confirmation) return;
			} else return;
		}
		// get the selected vehicle from the vehicle list
		const selectedPOI: PointOfInterest | undefined = poiList
			? poiList.find(poi => poi.id == newValue.value)
			: undefined;
		setSelPoi(newValue);
		// And set the form values to the properties of the newly selected vehicle
		setPoiName(selectedPOI?.name ?? "");
		setPoiTrack(selectedPOI?.trackId ?? null);
		setPoiType(selectedPOI?.typeId ?? null);
		setPoiDescription(selectedPOI?.description ?? "");
		setPoiPosition(selectedPOI?.pos ? L.latLng(selectedPOI?.pos) : initialPos);
		// Also reset the "dirty flag"
		setModified(false);
	};

	// Note: the onChange event for the inputs is needed as this is a controlled form. Se React documentation
	return (
		<ManagementForm<UpdatePointOfInterest>
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
			<label htmlFor={"selPoi"} className={"col-span-3"}>
				Interessenspunkt:
			</label>
			<StyledSelect value={selPoi} onChange={selectPoi} inputId={"selPoi"} name={"selPoi"} options={poiOptions} />
			<InputWithLabel
				value={poiName}
				setValue={setPoiName}
				setModified={setModified}
				id={"poiName"}
				name={"poiName"}>
				Name:
			</InputWithLabel>

			<ReferencedObjectSelect
				inputId={"poiTrack"}
				name={"poiTrack"}
				value={poiTrack}
				setValue={setPoiTrack}
				setModified={setModified}
				objects={tracks}
				mappingFunction={t => ({ value: t.id, label: `${t.start}\u2013${t.end}` })}>
				Strecke:
			</ReferencedObjectSelect>

			<ReferencedObjectSelect
				inputId={"vehicType"}
				name={"vehicType"}
				value={poiType}
				setValue={setPoiType}
				setModified={setModified}
				objects={poiTypes}
				mappingFunction={type => ({
					value: type.id,
					label: type.name
				})}>
				Interessenspunktart:
			</ReferencedObjectSelect>
			<label htmlFor={`poiDescription`} className={"col-span-3"}>
				Beschreibung:
			</label>
			<textarea
				name={"poiDescription"}
				id={`poiDescription`}
				value={poiDescription}
				className={"col-span-5 border border-gray-500 dark:bg-slate-700 rounded"}
				onChange={event => {
					setPoiDescription(event.target.value);
					setModified(true);
				}}></textarea>
			<div className={"col-span-3"}>Position:</div>
			<div className={"col-span-5"}>
				<PositionSelector
					position={poiPosition}
					setPosition={setPoiPosition}
					height={"16rem"}
					zoom_level={9.5}
				/>
			</div>
			<input
				type={"number"}
				value={poiPosition.lat}
				className={"col-start-4 col-span-2 border border-gray-500 dark:bg-slate-700 rounded"}
				step={"any"}
				onChange={e => {
					const newLat = Number(e.target.value);
					if (isFinite(newLat)) {
						const newPos = L.latLng(newLat, poiPosition.lng);
						setPoiPosition(newPos);
						setModified(true);
					}
				}}
			/>
			<input
				type={"number"}
				value={poiPosition.lng}
				className={"col-start-7 col-span-2 border border-gray-500 dark:bg-slate-700 rounded"}
				step={"any"}
				onChange={e => {
					const newLng = Number(e.target.value);
					if (isFinite(newLng)) {
						const newPos = L.latLng(poiPosition.lat, newLng);
						setPoiPosition(newPos);
						setModified(true);
					}
				}}
			/>
			<ErrorMessage error={err?.message} />
		</ManagementForm>
	);
}
