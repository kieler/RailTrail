"use client";

import { usePathname } from "next/navigation";
import {FormEvent, FormEventHandler, useEffect, useRef} from "react";

import { UrlObject, format } from 'url';
import Footer from "@/app/components/footer";
import {RevalidateError} from "@/lib/types";
import useSWR from "swr";
import {TrackList} from "@/lib/api.website";
import {setCookie} from "cookies-next";
type Url = string | UrlObject;

const selectTrack: FormEventHandler = (e) => {
    e.preventDefault()
    const data = new FormData(e.target as HTMLFormElement);

    // set the relevant cookie
    setCookie('track_id', data.get('track'));

    console.log(data);
    // and reload
    window.location.reload();
    return;
}

const fetcher = (url: string) => fetch(url).then(
        async (res: Response) => {
            if (!res.ok) {
                // console.log('not ok!');
                throw new RevalidateError('Re-Fetching unsuccessful', res.status);
            }
            //console.log('ok')
            return res;
        }
    ).then(res => res.json());

export default function Selection({dst_url}: {dst_url?: Url}) {
    // @type data TrackList
    const {data, error, isLoading}: {data: TrackList, error?: any, isLoading: boolean} = useSWR('/api/tracks/list', fetcher);

    return (
        <form onSubmit={selectTrack} className="grid grid-cols-2 gap-y-1 mx-1.5 items-center">
            {isLoading ? <p> Lädt... </p> : (<>
                <label htmlFor="track">Strecke: </label>
                <select id={'track'} name={'track'}>
                    {data.map(({id, name}) => (<option value={id} key={id}>{name}</option>))}
                </select>
            <button type="submit" className="col-span-2 rounded-full bg-gray-700 text-white">Auswählen</button>
            </>)}
        </form>
    )
}

export function SelectionDialog({dst_url, login_callback, children}: React.PropsWithChildren<{dst_url?: Url, login_callback?: (success: boolean) => void}>) {
    const dialogRef = useRef(null as HTMLDialogElement | null)

    useEffect(() => {
        if (!dialogRef.current?.open) {
            dialogRef.current?.showModal();
        }
    })

    return (<dialog ref={dialogRef} onCancel={(event) => {
        event.preventDefault();
    }} className="drop-shadow-xl shadow-black backdrop:bg-gray-200/30 backdrop:backdrop-blur" >
        {children}
        <Selection dst_url={dst_url} />
        <Footer />
    </dialog>)

}