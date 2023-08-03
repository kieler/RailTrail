"use client";

/*
This is a co-located client-component. It is not in the components folder, because it is unlikely to be useful anywhere
else, but also not in ´page.tsx` as we need to obtain the currently selected track id on the server.
 */

import {ChangeEventHandler, FormEventHandler, MouseEventHandler, useRef, useState} from "react";
import useSWR from "swr";
import {RevalidateError} from "@/utils/types";
import {UpdateVehicle, Vehicle, VehicleType} from "@/utils/api";
import {SelectionDialog} from "@/app/components/track_selection";
import {nanToUndefined} from "@/utils/helpers";

// The function SWR uses to request a list of vehicles
const fetcher = async ([url, track_id]: [url: string, track_id: number]) => {
    const res = await fetch(`${url}${track_id}`, {method: 'GET',});
    if (!res.ok) {
        // console.log('not ok!');
        throw new RevalidateError('Re-Fetching unsuccessful', res.status);
    }
    const res_2: Vehicle[] = await res.json();
    // Add a placeholder vehicle, used for adding a new one.
    res_2.unshift({id: NaN, name: '[Neues Fahrzeug hinzufügen]', type: NaN, trackerIds: []});
    return res_2;
};

export default function VehicleManagement({trackID, vehicleTypes}: {
    trackID?: string,
    vehicleTypes: VehicleType[]
}) {

    // fetch Vehicle information with swr.
    const {
        data: vehicleList,
        error: err,
        isLoading,
        mutate
    } = useSWR(trackID ? ['/webapi/vehicles/list/', trackID] : null, fetcher)

    // TODO: handle fetching errors

    // Form states
    const [selVehicle, setSelVehicle] = useState('');
    const [vehicName, setVehicName] = useState('');
    const [vehicType, setVehicType] = useState('');
    const [vehicTrackers, setVehicTrackers] = useState(['']);
    /** modified: A "dirty flag" to prevent loosing information. */
    const [modified, setModified] = useState(false);

    // This form needs to be a "controlled form" (React lingo), as the contents of the form are updated
    // whenever a different vehicle is selected.

    // Form submission state
    const formRef = useRef(null as (null | HTMLFormElement));
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(undefined as string | undefined);

    // Form submission function
    const updateVehicle: FormEventHandler = async (e) => {
        e.preventDefault();
        // create the corresponding payload to send to the backend.
        // When adding a new vehicle, uid should be undefined, and `selVehicle` should be an empty string
        const updatePayload: UpdateVehicle = {
            id: nanToUndefined(+(selVehicle || NaN)),
            name: vehicName,
            type: +vehicType,
            trackerIds: vehicTrackers
        }

        console.log('updatePayload', updatePayload);

        try {
            // Send the payload to our own proxy-API
            const result = await fetch(`/webapi/vehicles/update/${trackID}`, {
                method: 'post',
                body: JSON.stringify(updatePayload),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            // and set state based on the response
            if (result.ok) {
                setSuccess(true);
                setError(undefined)
                // invalidate cached result for key ['/webapi/vehicles/list/', trackID]
                mutate();
            } else {
                if (result.status == 401)
                    setError('Authorisierungsfehler: Sind Sie angemeldet?')
                if (result.status >= 500 && result.status < 600)
                    setError(`Serverfehler ${result.status} ${result.statusText}`)
            }
        } catch (e) {
            setError(`Connection Error: ${e}`)
        }

    }

    const deleteVehicle: FormEventHandler = async (e) => {
        e.preventDefault();
        const vehicle = vehicleList && getVehicleByUid(vehicleList, Number.parseInt(selVehicle, 10));

        // Ask the user for confirmation that they indeed want to delete the vehicle
        const confirmation = confirm(`Möchten Sie das Fahrzeug ${vehicle?.name} wirklich entfernen?`)

        if (confirmation) {
            try {
                // send the deletion request to our proxy-API
                const result = await fetch(`/webapi/vehicles/delete/${selVehicle}`, {
                    method: 'DELETE'
                })

                // and set state based on the response
                if (result.ok) {
                    setSuccess(true);
                    setError(undefined)
                    // invalidate cached result for key ['/webapi/vehicles/list/', trackID]
                    mutate();
                } else {
                    if (result.status == 401)
                        setError('Authorisierungsfehler: Sind Sie angemeldet?')
                    if (result.status >= 500 && result.status < 600)
                        setError(`Serverfehler ${result.status} ${result.statusText}`)
                }
            } catch (e) {
                setError(`Connection Error: ${e}`)
            }
        }
    }

    // select different vehicle function

    const getVehicleByUid = (vehicleList: Vehicle[], uid: number) => vehicleList.find(vehicle => (vehicle.id == uid))

    const selectVehicle: ChangeEventHandler<HTMLSelectElement> = (e) => {
        e.preventDefault()
        console.log(e.target.value, typeof e.target.value);
        // if a different vehicle is selected, and the form data is "dirty", ask the user if they really want to overwrite their changes
        if (modified) {
            if (e.target.value != selVehicle) {
                const confirmation = confirm('Möchten Sie wirklich ein anderes Fahrzeug wählen? Ihre aktuellen Änderungen gehen verloren!')
                if (!confirmation)
                    return;
            } else
                return;
        }
        // get the selected vehicle from the vehicle list
        const selectedVehicle = vehicleList ? getVehicleByUid(vehicleList, Number.parseInt(e.target.value, 10)) : undefined;
        setSelVehicle(e.target.value);
        // And set the form values to the properties of the newly selected vehicle
        setVehicName(selectedVehicle?.name ?? '');
        setVehicType('' + (selectedVehicle?.type ?? ''));
        setVehicTrackers(selectedVehicle?.trackerIds ?? ['']);
        // Also reset the "dirty flag"
        setModified(false);
    }

    // tracker related functions

    /** Add a new field for another tracker */
    const addTracker: MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        // We need to create a new list, otherwise React will be unhappy.
        const newTrackerList = vehicTrackers.concat(['']);
        setVehicTrackers(newTrackerList);
    }

    /** Change the value of a specific tracker. */
    const updateTracker = (target_idx: number, target_val: string) => {
        // We need to create a new list, otherwise React will be unhappy.
        const newTrackerList = vehicTrackers.map((list_val, list_idx) => list_idx == target_idx ? target_val : list_val);
        setVehicTrackers(newTrackerList);
    }

    /** Remove a specific tracker. */
    const removeTracker = (target_idx: number) => {
        // We need to create a new list, otherwise React will be unhappy.
        const newTrackerList = vehicTrackers.filter((_, list_idx) => list_idx != target_idx);
        setVehicTrackers(newTrackerList);
    }

    // Note: the onChange event for the inputs is needed as this is a controlled form. Se React documentation
    return (
        <>
            <form onSubmit={updateVehicle} ref={formRef}
                  className={'grid grid-cols-8 gap-y-2 mx-1.5 items-center'}>
                {/* Display a success message if the success flag is true */ success ? <div
                    className='transition ease-in col-span-8 bg-green-300 border-green-600 text-black rounded p-2 text-center'>
                    <div>Änderungen erfolgreich durchgeführt</div>
                    <button className={"rounded-full bg-gray-700 px-10 text-white"} type={'button'}
                            onClick={() => {
                                setSuccess(false);
                                setModified(false)
                            }}>Weitere Änderung durchführen
                    </button>
                </div> : <>
                    <label htmlFor={'selVehicle'} className={'col-span-3'}>Fahrzeug:</label>
                    <select value={selVehicle} onChange={selectVehicle} id={'selVehicle'} name={'selVehicle'}
                            className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded">
                        {/* Create an option for each vehicle in the vehicle list */
                            vehicleList?.map((v) => <option key={v.id}
                                                            value={nanToUndefined(v.id) ?? ''}>{v.name}</option>)}
                    </select>
                    <label htmlFor={'vehicName'} className={'col-span-3'}>Name:</label>
                    <input value={vehicName} id={'vehicName'} name={'vehicName'}
                           className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
                           onChange={(e) => {
                               setVehicName(e.target.value);
                               setModified(true)
                           }}
                    />
                    <label htmlFor={'vehicType'} className={'col-span-3'}>Fahrzeugart:</label>
                    <select value={vehicType} id={'vehicType'} name={'vehicType'}
                            className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
                            onChange={(e) => {
                                setVehicType(e.target.value);
                                setModified(true)
                            }}
                    >
                        <option value={''} disabled={true}>[Bitte auswählen]</option>
                        {
                            /* Create an option for each vehicle type currently in the backend */
                            vehicleTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)
                        }
                    </select>
                    { /* Convoluted code to allow for multiple tracker entries. Essentially, for each tracker input,
                        there is a corresponding field in the tracker state tuple.
                        Which is then mapped to produce a label, an input, and a remove button for this tracker entry */
                        vehicTrackers.map((uid, idx,) => (<>
                            <label htmlFor={`vehicTracker${idx}`} className={'col-span-3'}>{idx == 0
                                ? /*Only the first tracker gets a visible label. Every other is only for screen readers.*/
                                <>Tracker<span
                                    className="sr-only"> Nummer {`${idx + 1}`}</span>:</>
                                : <span className="sr-only">Tracker Nummer {`${idx + 1}`}: </span>
                            }</label>
                            <input name={'vehicTrackers'} id={`vehicTracker${idx}`} value={uid}
                                   className={"col-span-4 border border-gray-500 dark:bg-slate-700 rounded"}
                                   onChange={(event) => updateTracker(idx, event.target.value)}/>
                            <button
                                className={'col-span-1 border border-gray-500 dark:bg-slate-700 rounded h-full ml-4 content-center'}
                                type={'button'} onClick={() => removeTracker(idx)}>Entfernen
                            </button>
                        </>))}
                    <div className={'col-span-3'}/>
                    {/* Also offer a button to add another tracker entry */}
                    <button
                        className={'col-span-5 border border-gray-500 dark:bg-slate-700 rounded h-full content-center'}
                        type={'button'} onClick={addTracker}>Tracker hinzufügen
                    </button>
                </>}
                {/* display an error message if there is an error */ error && <div
                    className='col-span-8 bg-red-300 border-red-600 text-black rounded p-2 text-center'>{error}</div>}
                {!success && !isLoading &&
                    <>
                        {/*And finally some buttons to submit the form. The deletion button is only available when an existing vehicle is selected.*/}
                        <button type={"submit"} className="col-span-8 rounded-full bg-gray-700 text-white"
                                onSubmitCapture={updateVehicle}>Ändern/hinzufügen
                        </button>
                        <button type={"button"}
                                className="col-span-8 rounded-full disabled:bg-gray-300 bg-gray-700 text-white"
                                onClick={deleteVehicle} disabled={selVehicle === ''}>Löschen
                        </button>
                    </>
                }
            </form>
            {!trackID &&
                <SelectionDialog><p>Bitte wählen Sie die Strecke auf, auf der Sie die Fahrzeuge bearbeiten möchten.</p>
                </SelectionDialog>}
        </>
    );
}