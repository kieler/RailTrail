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

export function LoginDialog({dst_url, description, foo}: {dst_url?: Url, description?: string, foo: JSX.Element}) {
    const dialogRef = useRef(null as HTMLDialogElement | null)

    useEffect(() => {
        if (!dialogRef.current?.open) {
            dialogRef.current?.showModal();
        }
        console.log(foo.props.logged_in = true);
    })

    return (<dialog ref={dialogRef} className="backdrop:bg-slate-900/30 backdrop:backdrop-blur" >
        {description && <p>{description}</p>}
        <Login dst_url={dst_url} />
    </dialog>)

}