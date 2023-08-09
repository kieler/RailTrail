/**
 * A collection on functions that relate to fetching data from the backend.
 */

import {
    AuthenticationRequest,
    AuthenticationResponse,
    InitResponse, TrackList,
    TrackPath,
    Vehicle
} from "./api.website";
import {UnauthorizedError} from "@/utils/types";
import 'server-only'

/** The base path from which the webserver process can reach the backend server. */
const BACKEND_BASE_PATH = process.env['BACKEND_URI']

export const getVehicleData = async (token: string, track_id: number) => {

    const auth_header_line = `Bearer ${token}`
    const x = await fetch(`${BACKEND_BASE_PATH}/api/vehicles/website/${track_id}`, {
        cache: 'no-store', headers:
            {
                "Authorization": auth_header_line
            }
    })
    if (x.ok) {
        const data: Vehicle[] = await x.json();
        // console.log("data", data);
        return data
    } else if (x.status == 401) {
        throw new UnauthorizedError('Token expired');
    } else {
        console.log("Could not fetch vehicle positions (server)", x.status, x.statusText)
        return []
    }
}

export async function authenticate(username: string, password: string, signup?: string): Promise<string | undefined> {

    const auth_msg: AuthenticationRequest = {username: username, password: password};
    const auth_resp_json = await fetch(signup ? `${BACKEND_BASE_PATH}/api/login/signup` : `${BACKEND_BASE_PATH}/api/login/website`, {
        method: "POST", body: JSON.stringify(auth_msg), headers: {
            "Content-Type": "application/json",
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    if (auth_resp_json.ok) {
        const auth_resp: AuthenticationResponse = await auth_resp_json.json();
        return auth_resp.token;
    }
    // return 'aaaaabbbbaaabbabaaa';
    return;
}

export async function sendTrack(token: string, trackPayload: TrackPath) {
    const auth_header_line = `Bearer ${token}`
    try {
        const x = await fetch(`${BACKEND_BASE_PATH}/api/trackupload/website`, {
            method: "POST", body: JSON.stringify(trackPayload), headers: {
                "Content-Type": "application/json",
                "Authorization": auth_header_line
            },
        })
        if (x.ok) {
            const trackid: string = await x.text();
            // console.log("data", data);
            return trackid;
        } else if (x.status == 401) {
            throw new UnauthorizedError('Token expired');
        } else {
            console.log("Could not upload track", x.status, x.statusText)
            return undefined;
        }
    } catch (e) {
        if (e instanceof UnauthorizedError)
            throw e;
        console.error("An error uploading track", e);
        return undefined;
    }
}

export const getInitData = async (token: string, track_id: number) => {
    const auth_header_line = `Bearer ${token}`
    const x = await fetch(`${BACKEND_BASE_PATH}/api/init/website/${track_id}`, {
        cache: 'no-store', headers:
            {
                "Authorization": auth_header_line
            }
    })
    if (x.ok) {
        const data: InitResponse = await x.json();
        // console.log("data", data);
        return data
    } else if (x.status == 401) {
        throw new UnauthorizedError('Token expired');
    } else {
        console.log("Could not fetch vehicle positions (server)", x.status, x.statusText)
        return;
    }
}

export const getTrackList = async (token: string) => {
    const auth_header_line = `Bearer ${token}`
    const x = await fetch(`${BACKEND_BASE_PATH}/api/init/website`, {
        cache: 'no-store', headers:
            {
                "Authorization": auth_header_line
            }
    })
    if (x.ok) {
        const data: TrackList = await x.json();
        // console.log("data", data);
        return data
    } else if (x.status == 401) {
        throw new UnauthorizedError('Token expired');
    } else {
        console.log("Could not fetch vehicle positions (server)", x.status, x.statusText)
        return;
    }
}