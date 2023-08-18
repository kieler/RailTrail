"use client";

/*
This is a co-located client-component. It is not in the components folder, because it is unlikely to be useful anywhere
else, but also not in ´page.tsx` as we need to obtain the currently selected track id on the server.
 */

import {FormEventHandler, useRef, useState} from "react";
import useSWR from "swr";
import {Option, RevalidateError} from "@/utils/types";
import {CreatePOIType, POIType} from "@/utils/api";
import Select, {Options, SingleValue} from "react-select";
import IconSelection from "@/app/components/iconSelection";

// The function SWR uses to request a list of vehicles
const fetcher = async (url: string) => {
    const res = await fetch(url, {method: 'GET',});
    if (!res.ok) {
        // console.log('not ok!');
        throw new RevalidateError('Re-Fetching unsuccessful', res.status);
    }
    const res_2: POIType[] = await res.json();

    return res_2;
};

export default function POITypeManagement() {

    // fetch Vehicle information with swr.
    const {
        data: poiTypeList,
        error: err,
        isLoading,
        mutate
    } = useSWR('/webapi/poiTypes/list', fetcher)

    // TODO: handle fetching errors
    // react-select foo
    // Add a placeholder poiOption, used for adding a new one.
    const addOption: Option<number | null> = {value: null, label: '[Neue Interessenspunktart hinzufügen]',};
    const poiTypeOptions: Options<Option<number | null>> = [addOption, ...(poiTypeList?.map((t) => ({
        value: t.id,
        label: t.name
    })) ?? [])];

    // Form states
    const [selType, setSelType] = useState(addOption);
    const [typeName, setTypeName] = useState('');
    const [typeIcon, setTypeIcon] = useState('');
    const [typeDescription, setTypeDescription] = useState('');
    /** modified: A "dirty flag" to prevent loosing information. */
    const [modified, setModified] = useState(false);


    // This form needs to be a "controlled form" (React lingo), as the contents of the form are updated
    // whenever a different vehicle type is selected.

    // Form submission state
    const formRef = useRef(null as (null | HTMLFormElement));
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(undefined as string | undefined);

    // Form submission function
    const updateType: FormEventHandler = async (e) => {
        e.preventDefault();
        // create the corresponding payload to send to the backend.
        // When adding a new vehicle type, uid should be undefined, and `selType` should be an empty string
        const createPayload: CreatePOIType = {
            name: typeName,
            icon: typeIcon,
            description: typeDescription || undefined,
        }

        const updatePayload: POIType | undefined = selType.value ? {id: selType.value, ...createPayload} : undefined;

        console.log('updatePayload', createPayload);

        try {
            // Send the payload to our own proxy-API
            const result = selType.value === null
                ? await fetch(`/webapi/poiTypes/create`, {
                    method: 'post',
                    body: JSON.stringify(createPayload),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
                : await fetch(`/webapi/poiTypes/update/${selType.value}`, {
                    method: 'put',
                    body: JSON.stringify(updatePayload),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                })
            // and set state based on the response
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
    const getTypeByUid = (vehicleTypeList: POIType[], uid: number | null) => vehicleTypeList.find(type => (type.id == uid))

    const deleteType: FormEventHandler = (e) => {
        e.preventDefault();
        const type = poiTypeList && getTypeByUid(poiTypeList, selType.value);

        // Ask the user for confirmation that they indeed want to delete the vehicle
        const confirmation = confirm(`Möchten Sie den Interessenspunkttyp ${type?.name} wirklich entfernen?`)

        if (confirmation) {
            // send the deletion request to our proxy-API
            fetch(`/webapi/poiTypes/delete/${selType.value}`, {
                method: 'DELETE'
            }).then((result) => {
                // and set state based on the response
                if (result.ok) {
                    // invalidate cached result for key ['/webapi/vehicles/list/', trackID]
                    mutate().then(() => {
                            setSuccess(true);
                            setError(undefined);
                        }
                    )
                } else {
                    if (result.status == 401)
                        setError('Authorisierungsfehler: Sind Sie angemeldet?')
                    if (result.status >= 500 && result.status < 600)
                        setError(`Serverfehler ${result.status} ${result.statusText}`)
                }
            }).catch(e => {
                setError(`Connection Error: ${e}`)
            });
        }
    }

    // select different vehicle type function
    const selectType = (newValue: SingleValue<Option<number | null>>) => {
        if (!newValue) {
            return;
        }
        // if a different vehicle type is selected, and the form data is "dirty", ask the user if they really want to overwrite their changes
        if (modified) {
            if (newValue.value != selType.value) {
                const confirmation = confirm('Möchten Sie wirklich eine andere Fahrzeugart wählen? Ihre aktuellen Änderungen gehen verloren!')
                if (!confirmation)
                    return;
            } else
                return;
        }
        // get the selected vehicle type from the vehicle type list
        const selectedType = poiTypeList ? getTypeByUid(poiTypeList, newValue.value) : undefined;

        setSelType(newValue);
        // And set the form values to the properties of the newly selected vehicle type
        setTypeName(selectedType?.name ?? '');
        setTypeIcon(selectedType?.icon ?? '');
        setTypeDescription('' + (selectedType?.description ?? ''));
        setModified(false);
    }

    // Note: the onChange event for the inputs is needed as this is a controlled form. Se React documentation
    return (
        <form onSubmit={updateType} ref={formRef}
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
            </div> : poiTypeList ? <>
                <label htmlFor={'selType'} className={'col-span-3'}>Fahrzeugart:</label>
                <Select value={selType} onChange={selectType} id={'selType'} name={'selType'}
                        className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
                        options={poiTypeOptions}/>
                <label htmlFor={'typeName'} className={'col-span-3'}>Name:</label>
                <input value={typeName} id={'typeName'} name={'typeName'}
                       className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
                       onChange={(e) => {
                           setTypeName(e.target.value);
                           setModified(true)
                       }}
                />
                <label htmlFor={'typeIcon'} className={'col-span-3'}>Icon:</label>
                <IconSelection
                    currentIcon={typeIcon} id={'typeIcon'} name={'typeIcon'}
                    className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
                    setIcon={setTypeIcon} setModified={setModified}
                />
                <label htmlFor={'typeDescription'} className={'col-span-3'}>Beschreibung:</label>
                <textarea value={typeDescription} id={'typeDescription'} name={'typeDescription'}
                          className="col-span-5 border border-gray-500 dark:bg-slate-700 rounded"
                          onChange={(e) => {
                              setTypeDescription(e.target.value);
                              setModified(true)
                          }}
                />
                {/* display an error message if there is an error */ error && <div
                    className='col-span-8 bg-red-300 border-red-600 text-black rounded p-2 text-center'>{error}</div>}
                {!success && !isLoading &&
                    <>
                        {/*And finally some buttons to submit the form. The deletion button is only available when an existing vehicle type is selected.*/}
                        <button type={"submit"} className="col-span-8 rounded-full bg-gray-700 text-white"
                                onSubmitCapture={updateType}>{selType.value === null ? "Hinzufügen" : "Ändern"}
                        </button>
                        <button type={"button"}
                                className="col-span-8 rounded-full disabled:bg-gray-300 bg-gray-700 text-white"
                                onClick={deleteType} disabled={selType.value === null}>Löschen
                        </button>
                    </>
                }
            </> : <div>Lädt...</div>
            }
        </form>
    );
}