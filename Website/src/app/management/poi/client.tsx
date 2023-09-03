"use client";
"use strict";

/*
This is a co-located client-component. It is not in the components folder, because it is unlikely to be useful anywhere
else, but also not in ´page.tsx` as we need to obtain the currently selected track id on the server.
 */

import { FormEventHandler, useRef, useState } from "react";
import useSWR from "swr";
import { BareTrack, PointOfInterest, POIType, Position, UpdatePointOfInterest } from "@/utils/api";
import L from "leaflet";
import PositionSelector from "@/app/components/form_map";
import { getFetcher } from "@/utils/fetcher";
import { Option } from "@/utils/types";
import { Options, SingleValue } from "react-select";
import { SuccessMessage } from "@/app/management/components/successMessage";
import { ErrorMessage } from "@/app/management/components/errorMessage";
import { SubmitButtons } from "@/app/management/components/submitButtons";
import { InputWithLabel } from "@/app/management/components/inputWithLabel";
import { StyledSelect } from "@/app/management/components/styledSelect";
import { ReferencedObjectSelect } from "@/app/management/components/referencedObjectSelect";

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
		isLoading,
		mutate
	} = useSWR(noFetch ? null : "/webapi/poi/list", getFetcher<"/webapi/poi/list">);

	const initialPos = L.latLng({ lat: 54.2333, lng: 10.6024 });

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
	// whenever a different vehicle is selected.

	// Form submission state
	const formRef = useRef(null as null | HTMLFormElement);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState(undefined as string | undefined);

	// Form submission function
	const updatePoi: FormEventHandler = async e => {
		e.preventDefault();
		// create the corresponding payload to send to the backend.
		if (poiTrack == null) {
			setError("Bitte wählen Sie eine Strecke aus!");
			return;
		}
		if (poiType == null) {
			setError("Bitte wählen Sie einen Typ aus!");
			return;
		}

		const leafletPos = L.latLng(poiPosition);
		const apiPos: Position = {
			lat: leafletPos.lat,
			lng: leafletPos.lng
		};

		const updatePayload: UpdatePointOfInterest = {
			id: selPoi.value === "" ? undefined : selPoi.value,
			isTurningPoint: false,
			pos: apiPos,
			trackId: poiTrack,
			name: poiName,
			typeId: poiType,
			description: poiDescription
		};

		console.log("updatePayload", updatePayload);

		try {
			const send_path = selPoi.value === "" ? `/webapi/poi/create` : `/webapi/poi/update/${selPoi.value}`;
			const send_method = selPoi.value === "" ? "post" : "put";
			// Send the payload to our own proxy-API. Create if the selected ID is empty.
			const result = await fetch(send_path, {
				method: send_method,
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
				await mutate();
				// invalidate cached result for key ['/webapi/vehicles/list/', trackID]
			} else {
				if (result.status == 401) setError("Authorisierungsfehler: Sind Sie angemeldet?");
				if (result.status >= 500 && result.status < 600)
					setError(`Serverfehler ${result.status} ${result.statusText}`);
			}
		} catch (e) {
			setError(`Connection Error: ${e}`);
		}
	};

	const deletePoi: FormEventHandler = async e => {
		e.preventDefault();
		const poi = poiList && poiList.find(poi => poi.id == selPoi.value);

		// Ask the user for confirmation that they indeed want to delete the vehicle
		const confirmation = confirm(`Möchten Sie den Interessenspunkt ${poi?.name} wirklich entfernen?`);

		if (confirmation) {
			try {
				// send the deletion request to our proxy-API
				const result = await fetch(`/webapi/poi/delete/${selPoi.value}`, {
					method: "DELETE"
				});

				// and set state based on the response
				if (result.ok) {
					await mutate();
					setSuccess(true);
					setError(undefined);
					// invalidate cached result for key ['/webapi/poi/list/', trackID]
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
		<>
			<form onSubmit={updatePoi} ref={formRef} className={"grid grid-cols-8 gap-2 mx-1.5 items-center"}>
				{
					/* Display a success message if the success flag is true */ success ? (
						<SuccessMessage {...{ setSuccess, setModified }} />
					) : (
						<>
							<label htmlFor={"selPoi"} className={"col-span-3"}>
								Interessenspunkt:
							</label>
							<StyledSelect
								value={selPoi}
								onChange={selectPoi}
								inputId={"selPoi"}
								name={"selPoi"}
								options={poiOptions}
							/>
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
						</>
					)
				}
				<ErrorMessage error={error} />
				<ErrorMessage error={err?.message} />
				{!success && !isLoading && <SubmitButtons creating={selPoi.value === ""} onDelete={deletePoi} />}
			</form>
		</>
	);
}
