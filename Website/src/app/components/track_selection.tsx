"use client";

import {FormEventHandler, useEffect, useRef} from "react";

import Footer from "@/app/components/footer";
import {RevalidateError} from "@/utils/types";
import useSWR from "swr";
import {TrackList} from "@/utils/api";
import {setCookie} from "cookies-next";
import {inter} from "@/utils/common";

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

export default function Selection() {
    // @type data TrackList
    const {data, error, isLoading}: {data: TrackList, error?: any, isLoading: boolean} = useSWR('/webapi/tracks/list', fetcher);

    return (
        <form onSubmit={selectTrack} className="grid grid-cols-2 gap-y-1 my-1.5 items-center">
            {isLoading ? <p> Lädt... </p> : (error ? <p> {error.toString()} </p> : (<>
                <label className={''} htmlFor="track">Strecke: </label>
                <select id={'track'} name={'track'} className="dark:bg-slate-700 rounded">
                    {data.map(({id, name}) => (<option value={id} key={id} className={`dark:bg-slate-700 dark:text-white ${inter.className}`}>{name}</option>))}
                </select>
            <button type="submit" className="col-span-2 rounded-full bg-gray-700 text-white">Auswählen</button>
            </>))}
        </form>
    )
}

export function SelectionDialog({children}: React.PropsWithChildren<{}>) {
    const dialogRef = useRef(null as HTMLDialogElement | null)

    useEffect(() => {
        if (!dialogRef.current?.open) {
            dialogRef.current?.showModal();
        }
    }, []);

    return (<dialog ref={dialogRef} onCancel={(event) => {
        event.preventDefault();
    }} className="drop-shadow-xl shadow-black bg-white p-4 rounded max-w-2xl w-full dark:bg-slate-800 dark:text-white backdrop:bg-gray-200/30 backdrop:backdrop-blur" >
        {children}
        <Selection />
        <Footer />
    </dialog>)

}