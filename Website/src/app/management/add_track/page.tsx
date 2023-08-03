'use client'

import {FormEvent, useRef, useState} from "react";
import {AddTrackRequest} from "@/utils/api.website";

export default function Home() {
    const formRef = useRef(null as (null | HTMLFormElement))
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(undefined as string | undefined)

    async function submit(e: FormEvent) {
        e.preventDefault()
        const form = formRef.current;
        if (!form) throw new Error('Form missing');
        const formData = new FormData(form);
        const trackFile = formData.get('track') as File
        const path = JSON.parse(await trackFile.text())

        const uploadRequest: AddTrackRequest = {
            path,
            start: formData.get('trackStart') as string,
            end: formData.get('trackEnd') as string,
        }

        try {
            const result = await fetch('/webapi/tracks/new', {
                body: JSON.stringify(uploadRequest),
                headers: {"Content-Type": "application/json"},
                method: 'PUT'
            },)

            if (result.ok) {
                setSuccess(true);
                setError(undefined)
            } else {
                if (result.status == 401)
                    setError('Authorisierungsfehler: Sind Sie angemeldet?')
                if (result.status >= 500 && result.status < 600)
                    setError(`Serverfehler ${result.status} ${result.statusText}`)
            }
        } catch (e) {
            setError(`Fehler: Konnte Anfrage nicht senden: ${e}`)
        }

    }

    return (
        <>
            {success ? <p className="bg-green-300 border-green-600 text-black rounded p-2 text-center">Track erfolgreich
                    hinzugefügt</p> :
                <form action={"#"} onSubmit={submit} ref={formRef}
                      className={'grid grid-cols-8 gap-y-2 mx-1.5 items-center'}>
                    <label htmlFor={'trackStart'} className={'col-span-3'}>Name des Startpunktes</label><input
                    id={'trackStart'} name={'trackStart'}
                    type={"text"} className="border border-gray-500 rounded col-span-5 dark:bg-slate-700"/>
                    <label htmlFor={'trackEnd'} className={'col-span-3'}>Name des Endpunktes</label><input
                    id={'trackEnd'} name={'trackEnd'} type={"text"}
                    className="border border-gray-500 rounded col-span-5 dark:bg-slate-700"/>
                    <label htmlFor={'track'} className={'col-span-3'}>Positionsdaten (GeoJSON)</label><input id='track'
                                                                                                             name={'track'}
                                                                                                             type={"file"}
                                                                                                             className={'col-span-5'}/>
                    {error && <div
                        className='col-span-8 bg-red-300 border-red-600 text-black rounded p-2 text-center'>{error}</div>}
                    <button type={"submit"} className="col-span-8 rounded-full bg-gray-700 text-white">Absenden</button>
                </form>
            }
        </>
    )
}