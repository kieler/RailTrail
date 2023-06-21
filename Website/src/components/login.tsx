"use client";

import { usePathname } from "next/navigation";
import {useEffect, useRef} from "react";

import { UrlObject, format } from 'url';
type Url = string | UrlObject;

export default function Login({dst_url}: {dst_url?: Url}) {
    const pathname = usePathname() || '/';
    return (
        <form action="api/auth" method="POST" className="grid grid-cols-2 gap-y-1">
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" name="username" className="border" />
                <label htmlFor="password">Passwort:</label>
                <input type="password" id="password" name="password" className="border"/>
                <input type="hidden" value={dst_url ? format(dst_url) : pathname} name="dst_url" />
            <button type="submit" className="col-span-2 border">Einloggen</button>
        </form>
    )
}

export function LoginDialog({dst_url, description}: {dst_url?: Url, description?: string}) {
    const dialogRef = useRef(null as HTMLDialogElement | null)

    useEffect(() => {dialogRef.current?.showModal()})

    return (<dialog ref={dialogRef} className="z-20 backdrop-blur-3xl" >
        {description && <p>{description}</p>}
        <Login dst_url={dst_url} />
    </dialog>)

}