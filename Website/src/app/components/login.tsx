"use client";

import { usePathname } from "next/navigation";
import {useEffect, useRef} from "react";

import { UrlObject, format } from 'url';
import Footer from "@/app/components/footer";
import Link from "next/link";
type Url = string | UrlObject;

/**
 * The Login form for this web application.
 * @param dst_url The URL where to redirect to when the login was successful or failed
 * @param signup  Parameter indicating whether this is a signup form (temporary, remove once disabled in the backend)
 * @param success Parameter indicating if a login attempt was successful. Either undefined, "true" for a successful login, or "false" for a failed login.
 */
export default function Login({dst_url, signup, success}: {dst_url?: Url, signup?: boolean, success?: string}) {
    const pathname = usePathname() || '/';
    return success === "true" ? (<div
        className='transition ease-in col-span-8 bg-green-300 border-green-600 text-black rounded p-2 text-center'>
        <div>Erfolgreich eingeloggt.</div>
        <Link className={"rounded-full bg-gray-700 px-10 text-white no-a-style"} href={'/'}>Zurück zur Hauptseite
        </Link>
    </div>) : (
        <form action="/webapi/auth" method="POST" className="grid grid-cols-2 gap-y-1 my-1.5 items-center">
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" name="username" className="border border-gray-500 dark:bg-slate-700 rounded" autoFocus={true} />
                <label htmlFor="password">Passwort:</label>
                <input type="password" id="password" name="password" className="border border-gray-500 dark:bg-slate-700 rounded"/>
                <input type="hidden" value={dst_url ? format(dst_url) : pathname} name="dst_url" />
            {signup && <input type={'hidden'} value={'true'} name={'signup'}/>}
            {/* display an error message if the login failed */ success === "false" && <div
                className='col-span-2 bg-red-300 border-red-600 text-black rounded p-2 text-center'>Login fehlgeschlagen!</div>}
            <button type="submit" className="col-span-2 rounded-full bg-slate-700 text-white dark:bg-slate-200 dark:text-black mt-1.5">Einloggen</button>
        </form>
    )
}

/**
 * The login form wrapped in a html dialog, for easy display in a modal way.
 * @param dst_url        The URL where to redirect to when the login was successful or failed.
 * @param login_callback (currently unused) function to call if login was/wasn't successful.
 * @param children       HTML elements to display over the login form in the dialog, for example for explanations.
 */
export function LoginDialog({dst_url, login_callback, children}: React.PropsWithChildren<{dst_url?: Url, login_callback?: (success: boolean) => void}>) {
    const dialogRef = useRef(null as HTMLDialogElement | null)
    const router = useRouter()

    useEffect(() => {
        if (!dialogRef.current?.open) {
            dialogRef.current?.showModal();
        }
    })

    return (<dialog ref={dialogRef} onCancel={(event) => {
        event.preventDefault();
    }} className="drop-shadow-xl shadow-black bg-white dark:bg-slate-800 p-4 rounded max-w-2xl w-full dark:text-white backdrop:bg-gray-200/30 backdrop:backdrop-blur" >
        {children}
        <Login dst_url={dst_url} />
        <Footer />
    </dialog>)

}