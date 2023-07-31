"use client";

/*
This is a co-located client-component. It is not in the components folder, because it is unlikely to be useful anywhere
else, but also not in ´page.tsx` as we need to obtain the currently selected track id on the server.
 */

import {ChangeEventHandler, FormEventHandler, useRef, useState} from "react";
import useSWR from "swr";
import {RevalidateError} from "@/utils/types";
import {VehicleTypeCrU, VehicleTypeList} from "@/utils/api.website";
import {nanToUndefined} from "@/utils/helpers";

const fetcher = async (url: string) => {
    const res = await fetch(url, {method: 'GET',});
    if (!res.ok) {
        // console.log('not ok!');
        throw new RevalidateError('Re-Fetching unsuccessful', res.status);
    }
    const res_1 = await res;
    const res_2: VehicleTypeList = await res_1.json();
    res_2.push({uid: NaN, name: '[Neue Fahrzeugart hinzufügen]',});
    return res_2;
};

export default function VehicleTypeManagement() {

    // Vehicle information
    const {
        data: vehicleTypeList,
        error: err,
        isLoading,
        mutate
    } = useSWR('/webapi/vehicleTypes/list', fetcher)
    // const vehicleList: VehicleListItem[] | undefined = isLoading ? undefined : data;

    // console.log('data', vehicleList, isLoading, err);

    // Form states
    const [selType, setSelType] = useState('');
    const [typeName, setTypeName] = useState('');
    const [typeDescription, setTypeDescription] = useState('');
    // const [vehicTrackers, setVehicTrackers] = useState(['']);
    /** @const modified: A "dirty flag" to prevent loosing information. */
    const [modified, setModified] = useState(false);

    // Form submission state
    const formRef = useRef(null as (null | HTMLFormElement));
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(undefined as string | undefined);

    // Form submission function
    const updateType: FormEventHandler = async (e) => {
        e.preventDefault();
        // const formData = new FormData(formRef.current ?? undefined);
        const updatePayload: VehicleTypeCrU = {
            uid: nanToUndefined(+(selType || NaN)),
            name: typeName,
            description: typeDescription || undefined,
        }

        console.log('updatePayload', updatePayload);

        try {
            const result = await fetch(`/webapi/vehicleTypes/update`, {
                method: 'post',
                body: JSON.stringify(updatePayload),
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            if (result.ok) {
                setSuccess(true);
                setError(undefined);
                // tell swr that the data on the server has probably changed.
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

    const deleteType: FormEventHandler = (e) => {
        e.preventDefault();
        setError('gelöscht!');
    }

    // select different vehicle function

    const getTypeByUid = (vehicleTypeList: VehicleTypeList, uid: number) => {
        for (const type of vehicleTypeList) {
            if (type.uid == uid)
                return type;
        }
        return;
    }

    const selectVehicle: ChangeEventHandler<HTMLSelectElement> = (e) => {
        e.preventDefault()
        console.log(e.target.value, typeof e.target.value);
        if (modified) {
            if (e.target.value != selType) {
                const confirmation = confirm('Möchten Sie wirklich eine andere Fahrzeugart wählen? Ihre aktuellen Änderungen gehen verloren!')
                if (!confirmation)
                    return;
            } else
                return;
        }
        const selectedType = vehicleTypeList ? getTypeByUid(vehicleTypeList, Number.parseInt(e.target.value, 10)) : undefined;
        setSelType(e.target.value);
        setTypeName(selectedType?.name ?? '');
        setTypeDescription('' + (selectedType?.description ?? ''));
        setModified(false);
    }

    return (
        <form onSubmit={updateType} ref={formRef}
              className={'grid grid-cols-8 gap-y-2 mx-1.5 items-center'}>
            {success ? <div
                className='transition ease-in col-span-8 bg-green-300 border-green-600 text-black rounded p-2 text-center'>
                <div>Änderungen erfolgreich durchgeführt</div>
                <button className={"rounded-full bg-gray-700 px-10 text-white"} type={'button'}
                        onClick={() => {
                            setSuccess(false);
                            setModified(false)
                        }}>Weitere Änderung durchführen
                </button>
            </div> : <>
                <label htmlFor={'selType'} className={'col-span-3'}>Fahrzeugart:</label>
                <select value={selType} onChange={selectVehicle} id={'selType'} name={'selType'}
                        className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded">
                    {vehicleTypeList?.map((v) => <option key={v.uid}
                                                         value={nanToUndefined(v.uid) ?? ''}>{v.name}</option>)}
                </select>
                <label htmlFor={'typeName'} className={'col-span-3'}>Name:</label>
                <input value={typeName} id={'typeName'} name={'typeName'}
                       className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
                       onChange={(e) => {
                           setTypeName(e.target.value);
                           setModified(true)
                       }}
                />
                <label htmlFor={'typeDescription'} className={'col-span-3'}>Beschreibung:</label>
                <textarea value={typeDescription} id={'typeDescription'} name={'typeDescription'}
                          className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
                          onChange={(e) => {
                              setTypeDescription(e.target.value);
                              setModified(true)
                          }}
                />
                {error && <div
                    className='col-span-8 bg-red-300 border-red-600 text-black rounded p-2 text-center'>{error}</div>}
                {!success && !isLoading &&
                    <>
                        <button type={"submit"} className="col-span-8 rounded-full bg-gray-700 text-white"
                                onSubmitCapture={updateType}>Ändern/hinzufügen
                        </button>
                        <button type={"button"} className="col-span-8 rounded-full bg-gray-700 text-white"
                                onClick={deleteType}>Löschen
                        </button>
                    </>
                }
            </>
            }
        </form>
    );
}