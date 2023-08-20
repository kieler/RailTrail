"use client"

/*
This is a co-located client-component. It is not in the components folder, because it is unlikely to be useful anywhere
else, but also not in ´page.tsx` as we need to obtain the currently selected track id on the server.
 */

import { ChangeEventHandler, FormEventHandler, useRef, useState } from "react"
import useSWR, { KeyedMutator } from "swr"
import { RevalidateError } from "@/utils/types"
import { Tracker, Vehicle } from "@/utils/api"
import { nanToNull } from "@/utils/helpers"

// The function SWR uses to request a list of vehicles
const fetcher = async (url: string) => {
	const res = await fetch(url, { method: "GET" })
	if (!res.ok) {
		// console.log('not ok!');
		throw new RevalidateError("Re-Fetching unsuccessful", res.status)
	}
	const res_2: Tracker[] = await res.json()
	// Add a placeholder vehicle, used for adding a new one.
	return res_2
}

export default function TrackerManagement({ vehicles }: { vehicles: Vehicle[] }) {
	// fetch Vehicle information with swr.
	const {
		data: trackerList,
		error: err,
		isLoading,
		mutate
	} = useSWR("/webapi/tracker/list", fetcher)

	// TODO: handle fetching errors

	return (
		<>
			<p>Hinzufügen:</p>
			<AddTracker vehicles={vehicles} mutateTrackerList={mutate} isLoading={isLoading} />
			<div className={"my-20"} />
			<p>Ändern:</p>
			<UpdateTracker {...{ vehicles, trackerList, mutateTrackerList: mutate, isLoading }} />
		</>
	)
}

function UpdateTracker({ vehicles, trackerList, mutateTrackerList, isLoading }: {
	vehicles: Vehicle[],
	trackerList?: Tracker[],
	mutateTrackerList: KeyedMutator<Tracker[]>,
	isLoading: boolean
}) {

	// Form states
	const [selTracker, setSelTracker] = useState("")
	const [trackerVehicle, setTrackerVehicle] = useState("NaN")
	/** modified: A "dirty flag" to prevent loosing information. */
	const [modified, setModified] = useState(false)

	// This form needs to be a "controlled form" (React lingo), as the contents of the form are updated
	// whenever a different vehicle type is selected.

	// Form submission state
	const formRef = useRef(null as (null | HTMLFormElement))
	const [success, setSuccess] = useState(false)
	const [error, setError] = useState(undefined as string | undefined)

	// Form submission function
	const updateTracker: FormEventHandler = async (e) => {
		e.preventDefault()
		// create the corresponding payload to send to the backend.
		// When adding a new vehicle type, uid should be undefined, and `selType` should be an empty string
		const updatePayload: Tracker = {
			id: selTracker,
			vehicleId: nanToNull(+trackerVehicle)
		}

		console.log("updatePayload", updatePayload)

		try {
			// encode any weird characters in the tracker id
			const safeTrackerId = encodeURIComponent(selTracker)
			// and send the update request to our proxy-API (where this will need to be repeated, as next will decode the URI encoding.)
			const result = await fetch(`/webapi/tracker/update/${safeTrackerId}`, {
				method: "put",
				body: JSON.stringify(updatePayload),
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json"
				}
			})
			// and set state based on the response
			if (result.ok) {
				setSuccess(true)
				setError(undefined)
				// tell swr that the data on the server has probably changed.
				mutateTrackerList()
			} else {
				if (result.status == 401)
					setError("Authorisierungsfehler: Sind Sie angemeldet?")
				if (result.status >= 500 && result.status < 600)
					setError(`Serverfehler ${result.status} ${result.statusText}`)
			}
		} catch (e) {
			setError(`Connection Error: ${e}`)
		}

	}
	const getTrackerByUid = (trackerList: Tracker[], uid: string) => trackerList.find(type => (type.id == uid))

	const deleteTracker: FormEventHandler = (e) => {
		e.preventDefault()
		const tracker = trackerList && getTrackerByUid(trackerList, selTracker)

		// Ask the user for confirmation that they indeed want to delete the vehicle
		const confirmation = confirm(`Möchten Sie den Tracker ${tracker?.id} wirklich entfernen?`)

		if (confirmation) {
			// encode any weird characters in the tracker id
			const safeTrackerId = encodeURIComponent(selTracker)
			// and send the deletion request to our proxy-API (where this will need to be repeated, as next will decode the URI encoding.
			fetch(`/webapi/tracker/delete/${safeTrackerId}`, {
				method: "DELETE"
			}).then((result) => {
				// and set state based on the response
				if (result.ok) {
					// invalidate cached result for key ['/webapi/vehicles/list/', trackID]
					mutateTrackerList().then(() => {
							setSuccess(true)
							setError(undefined)
							// reset the selected tracker, as the currently selected one will probably not be
							// a valid option for the selection anymore.
							setSelTracker("")
						}
					)
				} else {
					if (result.status == 401)
						setError("Authorisierungsfehler: Sind Sie angemeldet?")
					if (result.status >= 500 && result.status < 600)
						setError(`Serverfehler ${result.status} ${result.statusText}`)
				}
			}).catch(e => {
				setError(`Connection Error: ${e}`)
			})
		}
	}

	// select different vehicle type function
	const selectTracker: ChangeEventHandler<HTMLSelectElement> = (e) => {
		e.preventDefault()
		// if a different vehicle type is selected, and the form data is "dirty", ask the user if they really want to overwrite their changes
		if (modified) {
			if (e.target.value != selTracker) {
				const confirmation = confirm("Möchten Sie wirklich einen anderen Tracker wählen? Ihre aktuellen Änderungen gehen verloren!")
				if (!confirmation)
					return
			} else
				return
		}
		// get the selected vehicle type from the vehicle type list
		const selectedTracker = trackerList ? getTrackerByUid(trackerList, e.target.value) : undefined
		setSelTracker(e.target.value)
		// And set the form values to the properties of the newly selected tracker
		setTrackerVehicle("" + (selectedTracker?.vehicleId ?? ""))
		setModified(false)
	}

	// Note: the onChange event for the inputs is needed as this is a controlled form. Se React documentation
	return (
		<form onSubmit={updateTracker} ref={formRef}
					className={"grid grid-cols-8 gap-y-2 mx-1.5 items-center"}>
			{/* Display a success message if the success flag is true */ success ? <div
				className="transition ease-in col-span-8 bg-green-300 border-green-600 text-black rounded p-2 text-center">
				<div>Änderungen erfolgreich durchgeführt</div>
				<button className={"rounded-full bg-gray-700 px-10 text-white"} type={"button"}
								onClick={() => {
									setSuccess(false)
									setModified(false)
								}}>Weitere Änderung durchführen
				</button>
			</div> : <>
				<label htmlFor={"selTracker1"} className={"col-span-3"}>Tracker-ID:</label>
				<select value={selTracker} onChange={selectTracker} id={"selTracker1"} name={"selTracker"}
								className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded">
					<option key={"url"} value={""} disabled={true}>[Bitte Auswählen]</option>
					{/* Create an option for each tracker in the vehicle type list */
						trackerList?.map((t) => <option key={t.id}
																						value={t.id}>{t.id}</option>)
					}
				</select>

				<label htmlFor={"trackerVehicle1"} className={"col-span-3"}>Fahrzeug:</label>
				<select value={trackerVehicle} onChange={(e) => {
					setTrackerVehicle(e.target.value)
					setModified(true)
				}} id={"trackerVehicle"} name={"trackerVehicle1"}
								className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded">
					<option key={NaN} value={"NaN"}>[Keines]</option>
					{/* Create an option for each vehicle type in the vehicle type list */
						vehicles?.map((v) => <option key={v.id}
																				 value={v.id}>{v.name}</option>)
					}
				</select>

				{/* display an error message if there is an error */ error && <div
					className="col-span-8 bg-red-300 border-red-600 text-black rounded p-2 text-center">{error}</div>}
				{!success && !isLoading &&
					<>
						{/*And finally some buttons to submit the form. The deletion button is only available when an existing vehicle type is selected.*/}
						<button type={"submit"} className="col-span-8 rounded-full disabled:bg-gray-300 bg-gray-700 text-white"
										onSubmitCapture={updateTracker} disabled={selTracker === ""}>Ändern
						</button>
						<button type={"button"} className="col-span-8 rounded-full disabled:bg-gray-300 bg-gray-700 text-white"
										onClick={deleteTracker} disabled={selTracker === ""}>Löschen
						</button>
					</>
				}
			</>
			}
		</form>
	)
}

function AddTracker({ vehicles, mutateTrackerList, isLoading }: {
	vehicles: Vehicle[],
	mutateTrackerList: KeyedMutator<Tracker[]>,
	isLoading: boolean
}) {

	// Form submission state
	const formRef = useRef(null as (null | HTMLFormElement))
	const [success, setSuccess] = useState(false)
	const [error, setError] = useState(undefined as string | undefined)

	// Form submission function
	const createTracker: FormEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault()
		const data = new FormData(e.target as HTMLFormElement)
		// create the corresponding payload to send to the backend.
		const id = data.get("selTracker") as string
		const vehicleId = nanToNull(+(data.get("trackerVehicle") ?? NaN))
		const updatePayload: Tracker = {
			id,
			vehicleId
		}

		console.log("updatePayload", updatePayload)

		try {
			// Send the payload to our own proxy-API
			const result = await fetch(`/webapi/tracker/create`, {
				method: "post",
				body: JSON.stringify(updatePayload),
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json"
				}
			})
			// and set state based on the response
			if (result.ok) {
				setSuccess(true)
				setError(undefined)
				// tell swr that the data on the server has probably changed.
				await mutateTrackerList()
			} else {
				if (result.status == 401)
					setError("Authorisierungsfehler: Sind Sie angemeldet?")
				if (result.status >= 500 && result.status < 600)
					setError(`Serverfehler ${result.status} ${result.statusText}`)
			}
		} catch (e) {
			setError(`Connection Error: ${e}`)
		}

	}

	return (
		<form onSubmit={createTracker} ref={formRef}
					className={"grid grid-cols-8 gap-y-2 mx-1.5 items-center"}>
			{/* Display a success message if the success flag is true */ success ? <div
				className="transition ease-in col-span-8 bg-green-300 border-green-600 text-black rounded p-2 text-center">
				<div>Änderungen erfolgreich durchgeführt</div>
				<button className={"rounded-full bg-gray-700 px-10 text-white"} type={"button"}
								onClick={() => {
									setSuccess(false)
								}}>Weitere Änderung durchführen
				</button>
			</div> : <>
				<label htmlFor={"selTracker"} className={"col-span-3"}>Tracker:</label>
				<input id={"selTracker"} name={"selTracker"} type={"text"}
							 className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded">
				</input>

				<label htmlFor={"trackerVehicle"} className={"col-span-3"}>Fahrzeug:</label>
				<select id={"trackerVehicle"} name={"trackerVehicle"}
								className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded">
					<option key={NaN} value={"NaN"}>[Keines]</option>
					{/* Create an option for each vehicle type in the vehicle type list */
						vehicles?.map((v) => <option key={v.id}
																				 value={v.id}>{v.name}</option>)
					}
				</select>

				{/* display an error message if there is an error */ error && <div
					className="col-span-8 bg-red-300 border-red-600 text-black rounded p-2 text-center">{error}</div>}
				{!success && !isLoading &&
					<>
						{/*And finally some buttons to submit the form. The deletion button is only available when an existing vehicle type is selected.*/}
						<button type={"submit"} className="col-span-8 rounded-full bg-gray-700 text-white">Hinzufügen
						</button>
					</>
				}
			</>}
		</form>
	)
}