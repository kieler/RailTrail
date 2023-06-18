"use client";

import { cookies, headers  } from "next/headers";
import { AuthenticationRequest, AuthenticationResponse } from "./api_types";
import { FormEvent } from "react";
import { usePathname } from "next/navigation";

export default function Login() {
    return (
        <form action="api/auth" method="POST" className="grid grid-cols-2 gap-y-1">
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" name="username" className="border" />
                <label htmlFor="password">Passwort:</label>
                <input type="password" id="password" name="password" className="border"/>
                <input type="hidden" value={usePathname()} name="dst_url" />
            <button type="submit" className="col-span-2 border">Einloggen</button>
        </form>
    )
}