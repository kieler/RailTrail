"use client";

/*
This is a co-located client-component. It is not in the components folder, because it is unlikely to be useful anywhere
else, but also not in ´page.tsx` as we need to obtain the currently selected track id on the server.
 */

import {ChangeEventHandler, FormEventHandler, MouseEventHandler, useRef, useState} from "react";
import useSWR from "swr";
import {RevalidateError} from "@/lib/types";
import {VehicleCrU, VehicleList, VehicleTypeList} from "@/lib/api.website";
import {SelectionDialog} from "@/components/track_selection";
import {nanToUndefined} from "@/lib/helpers";

const fetcher = async ([url, track_id]: [url: string, track_id: number]) => {
    const res = await fetch(`${url}${track_id}`, {method: 'GET',});
    if (!res.ok) {
        // console.log('not ok!');
        throw new RevalidateError('Re-Fetching unsuccessful', res.status);
    }
    const res_1 = await res;
    const res_2: VehicleList = await res_1.json();
    // Add a placeholder vehicle
    res_2.unshift({uid: NaN, name: '[Neues Fahrzeug hinzufügen]', typeId: 0, trackerIds: []});
    return res_2;
};

export default function VehicleManagement({trackID, vehicleTypes}: {
    trackID?: string,
    vehicleTypes: VehicleTypeList
}) {

    // Vehicle information
    const {
        data: vehicleList,
        error: err,
        isLoading,
        mutate
    } = useSWR(trackID ? ['/webapi/vehicles/list/', trackID] : null, fetcher)
    // const vehicleList: VehicleListItem[] | undefined = isLoading ? undefined : data;

    // console.log('data', vehicleList, isLoading, err);

    // Form states
    const [selVehicle, setSelVehicle] = useState('');
    const [vehicName, setVehicName] = useState('');
    const [vehicPhyName, setVehicPhyName] = useState('');
    const [vehicType, setVehicType] = useState('');
    const [vehicTrackers, setVehicTrackers] = useState(['']);
    /** @const modified: A "dirty flag" to prevent loosing information. */
    const [modified, setModified] = useState(false);

    // Form submission state
    const formRef = useRef(null as (null | HTMLFormElement));
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(undefined as string | undefined);

    // Form submission function
    const updateVehicle: FormEventHandler = async (e) => {
        e.preventDefault();
        // create the corresponding payload to send to the backend.
        // When adding a new vehicle, uid should be undefined, and `selVehicle` should be an empty string
        const updatePayload: VehicleCrU = {
            uid: nanToUndefined(+(selVehicle || NaN)),
            name: vehicName,
            physicalName: vehicPhyName,
            typeId: +vehicType,
            trackerIds: vehicTrackers
        }

        console.log('updatePayload', updatePayload);

        try {
            const result = await fetch(`/webapi/vehicles/update/${trackID}`, {
                method: 'post',
                body: JSON.stringify(updatePayload),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
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

        const confirmation = confirm(`Möchten Sie das Fahrzeug ${vehicle?.name} wirklich entfernen?`)

        if (confirmation) {
            try {
                const result = await fetch(`/webapi/vehicles/delete/${selVehicle}`, {
                    method: 'DELETE'
                })
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

    const getVehicleByUid = (vehicleList: VehicleList, uid: number) => {
        for (const vehicle of vehicleList) {
            if (vehicle.uid == uid)
                return vehicle;
        }
        return;
    }

    const selectVehicle: ChangeEventHandler<HTMLSelectElement> = (e) => {
        e.preventDefault()
        console.log(e.target.value, typeof e.target.value);
        if (modified) {
            if (e.target.value != selVehicle) {
                const confirmation = confirm('Möchten Sie wirklich ein anderes Fahrzeug wählen? Ihre aktuellen Änderungen gehen verloren!')
                if (!confirmation)
                    return;
            } else
                return;
        }
        const selectedVehicle = vehicleList ? getVehicleByUid(vehicleList, Number.parseInt(e.target.value, 10)) : undefined;
        setSelVehicle(e.target.value);
        setVehicName(selectedVehicle?.name ?? '');
        setVehicPhyName(selectedVehicle?.physicalName ?? '');
        setVehicType('' + (selectedVehicle?.typeId ?? ''));
        setVehicTrackers(selectedVehicle?.trackerIds ?? ['']);
        setModified(false);
    }

    // tracker related functions

    const addTracker: MouseEventHandler<HTMLButtonElement> = (e) => {
        e.preventDefault();
        const newTrackerList = vehicTrackers.concat(['']);
        setVehicTrackers(newTrackerList);
    }

    const updateTracker = (target_idx: number, target_val: string) => {
        const newTrackerList = vehicTrackers.map((list_val, list_idx) => list_idx == target_idx ? target_val : list_val);
        setVehicTrackers(newTrackerList);
    }

    const removeTracker = (target_idx: number) => {
        const newTrackerList = vehicTrackers.filter((_, list_idx) => list_idx != target_idx);
        setVehicTrackers(newTrackerList);
    }


    return (
        <>
            <form onSubmit={updateVehicle} ref={formRef}
                  className={'grid grid-cols-8 gap-y-2 mx-1.5 items-center'}>
                {success ? <div
                    className='transition ease-in col-span-8 bg-green-300 border-green-600 text-black rounded p-2 text-center'>
                    <div>Änderungen erfolgreich durchgeführt</div>
                    <button className={"rounded-full bg-gray-700 px-10 text-white"} type={'button'}
                            onClick={() => {setSuccess(false); setModified(false)}}>Weitere Änderung durchführen
                    </button>
                </div> : <>
                    <label htmlFor={'selVehicle'} className={'col-span-3'}>Fahrzeug:</label>
                    <select value={selVehicle} onChange={selectVehicle} id={'selVehicle'} name={'selVehicle'}
                            className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded">
                        {vehicleList?.map((v) => <option key={v.uid}
                                                         value={nanToUndefined(v.uid) ?? ''}>{v.name}</option>)}
                    </select>
                    <label htmlFor={'vehicName'} className={'col-span-3'}>Name:</label>
                    <input value={vehicName} id={'vehicName'} name={'vehicName'}
                           className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
                           onChange={(e) => {
                               setVehicName(e.target.value);
                               setModified(true)
                           }}
                    />
                    <label htmlFor={'vehicPhyName'} className={'col-span-3'}>Physischer Name:</label>
                    <input value={vehicPhyName} id={'vehicPhyName'} name={'vehicPhyName'}
                           className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
                           onChange={(e) => {
                               setVehicPhyName(e.target.value);
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
                        {vehicleTypes.map((type) => <option key={type.uid} value={type.uid}>{type.name}</option>)}
                    </select>
                    {vehicTrackers.map((uid, idx, ) => (<>
                        <label htmlFor={`vehicTracker${idx}`} className={'col-span-3'}>{idx == 0
                            ? <>Tracker<span
                                className="sr-only"> Nummer {`${idx + 1}`}</span>:</>
                            : <span className="sr-only">Tracker Nummer {`${idx + 1}`}: </span>
                        }</label>
                        <input name={'vehicTrackers'} id={`vehicTracker${idx}`} value={uid} className={"col-span-4 border border-gray-500 dark:bg-slate-700 rounded"}
                               onChange={(event) => updateTracker(idx, event.target.value)}/>
                        <button className={'col-span-1 border border-gray-500 dark:bg-slate-700 rounded h-full ml-4 content-center'} type={'button'} onClick={() => removeTracker(idx)}>Entfernen</button>
                    </>))}
                    <div className={'col-span-3'}/>
                    <button className={'col-span-5 border border-gray-500 dark:bg-slate-700 rounded h-full content-center'} type={'button'} onClick={addTracker}>Tracker hinzufügen</button>
                </>}
                {error && <div
                    className='col-span-8 bg-red-300 border-red-600 text-black rounded p-2 text-center'>{error}</div>}
                {!success && !isLoading &&
                    <>
                        <button type={"submit"} className="col-span-8 rounded-full bg-gray-700 text-white"
                                onSubmitCapture={updateVehicle}>Ändern/hinzufügen
                        </button>
                        <button type={"button"} className="col-span-8 rounded-full disabled:bg-gray-300 bg-gray-700 text-white"
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