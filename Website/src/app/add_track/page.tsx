'use client'

import {FormEvent, useRef} from "react";
import {TrackPath} from "@/lib/api.website";

export default function Home(x: any) {
    const formRef = useRef(null as (null | HTMLFormElement))

    async function submit(e: FormEvent) {
        e.preventDefault()
        const form = formRef.current;
        if (!form) throw new Error('Form missing');
        const formData = new FormData(form);
        const trackFile = formData.get('track') as File
        const path = JSON.parse(await trackFile.text())

        const uploadRequest: TrackPath = {
            path,
            start: formData.get('trackStart') as string,
            end: formData.get('trackEnd') as string,
        }

        const result = await fetch('/api/tracks/new', {
            body: JSON.stringify(uploadRequest),
            headers: {"Content-Type": "application/json"},
            method: 'PUT'
        }, )

    }

    return (
        <div className='h-full min-h-screen'>
            <main className="container mx-auto max-w-2xl">
                <div className={'bg-white p-4 rounded'}>
                    <form action={"#"} onSubmit={submit} ref={formRef} className={'grid grid-cols-8 gap-y-1 mx-1.5 items-center'}>
                        <label htmlFor={'trackStart'} className={'col-span-3'}>Name des Startpunktes</label><input id={'trackStart'} name={'trackStart'}
                                                                               type={"text"} className="border border-gray-500 rounded col-span-5"/>
                        <label htmlFor={'trackEnd'} className={'col-span-3'}>Name des Endpunktes</label><input id={'trackEnd'} name={'trackEnd'} type={"text"} className="border border-gray-500 rounded col-span-5"/>
                        <label htmlFor={'track'} className={'col-span-3'}>Positionsdaten (GeoJSON)</label><input id='track' name={'track'}
                                                                                        type={"file"} className={'col-span-5'}/>
                        <button type={"submit"} className="col-span-8 rounded-full bg-gray-700 text-white">Absenden</button>
                    </form>
                </div>
            </main>
        </div>
    )
}