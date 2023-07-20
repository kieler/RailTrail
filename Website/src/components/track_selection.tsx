"use client";

import { usePathname } from "next/navigation";
import {useEffect, useRef} from "react";

import { UrlObject, format } from 'url';
import Footer from "@/app/components/footer";
type Url = string | UrlObject;

export default function Selection({dst_url}: {dst_url?: Url}) {
    const pathname = usePathname() || '/';
    return (
        <form action="api/auth" method="POST" className="grid grid-cols-2 gap-y-1 mx-1.5">
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" className="border border-gray-500 rounded" autoFocus={true} />
            <label htmlFor="password">Passwort:</label>
            <input type="password" id="password" name="password" className="border border-gray-500 rounded"/>
            <input type="hidden" value={dst_url ? format(dst_url) : pathname} name="dst_url" />
            <button type="submit" className="col-span-2 rounded-full bg-gray-700 text-white">Einloggen</button>
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