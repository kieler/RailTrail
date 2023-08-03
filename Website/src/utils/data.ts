/**
 * A collection on functions that relate to fetching data from the backend.
 */

import {
    AuthenticationRequest,
    AuthenticationResponse,
    AddTrackRequest,
} from "./api.website";
import {
    FullTrack,
    PointOfInterest,
    TrackList,
    UpdateVehicle,
    Vehicle,
    UpdateVehicleType,
    VehicleType, UpdatePointOfInterest
} from "@/utils/api";
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

export async function sendTrack(token: string, trackPayload: AddTrackRequest) {
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
        const data: FullTrack = await x.json();
        // console.log("data", data);
        return data
    } else if (x.status == 401) {
        throw new UnauthorizedError('Token expired');
    } else {
        console.log("Could not fetch init data (server):", x.status, x.statusText)
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


/**
 * Specialized update function for Vehicles
 *
 * Essentially a wrapper around CRUD_update
 *
 * @param token    The authentication token of the user initiating the update
 * @param track_id The id of the track where the vehicle is located
 * @param payload  The data with which the vehicle is updated
 */
export const updateVehicle = (token: string, track_id: number, payload: UpdateVehicle) => CRUD_update(token, `/api/vehicles/website/${track_id}`, payload);

/**
 * Specialized update function for VehicleTypes
 *
 * Essentially a wrapper around CRUD_update
 *
 * @param token    The authentication token of the user initiating the update
 * @param payload  The data with which the vehicle type is updated
 */
export const updateVehicleType = (token: string, payload: UpdateVehicleType) => CRUD_update(token, '/api/vehicletype/website', payload);

/**
 * Specialized update function for Points of Interest
 *
 * Essentially a wrapper around CRUD_update
 *
 * @param token    The authentication token of the user initiating the update
 * @param payload  The data with which the point of interest is updated
 */
export const updatePOI = (token: string, payload: UpdatePointOfInterest) => CRUD_update(token, '/api/poi/website', payload);


/**
 * A generic CRUD update/create function
 * @param token   The authentication token of the user initiating the update
 * @param trunk   The path on the backend where the update belongs
 * @param payload The data to be sent to the backend. MUST be JSON serializable.
 */
const CRUD_update = async (token: string, trunk: string, payload: any) => {
    const auth_header_line = `Bearer ${token}`;
    const res = await fetch(`${BACKEND_BASE_PATH}${trunk}`, {
        'method': 'POST', body: JSON.stringify(payload),
        cache: 'no-store', headers:
            {
                "Content-Type": "application/json",
                "Authorization": auth_header_line,
            }
    })

    return res;
}

export const deleteVehicle = (token: string, vehicleId: number) => CRUD_delete(token, `/api/vehicles/website/${vehicleId}`);

export const deleteVehicleType = (token: string, vehicleTypeId: number) => CRUD_delete(token, `/api/vehicletype/website/${vehicleTypeId}`);

export const deletePOI = (token: string, poiId: number) => CRUD_delete(token, `/api/poi/website/${poiId}`);


/**
 * A generic CRUD delete function
 * @param token   The authentication token of the user initiating the deletion
 * @param trunk   The path on the backend where the deletion belongs
 */
const CRUD_delete = async (token: string, trunk: string) => {
    const auth_header_line = `Bearer ${token}`;
    const res = await fetch(`${BACKEND_BASE_PATH}${trunk}`, {
        'method': 'DELETE',
        cache: 'no-store', headers:
            {
                "Authorization": auth_header_line
            }
    })

    return res;
}

export const getVehicleList: (token: string, trackId: number) => Promise<Vehicle[]> = (token: string, trackId: number) => CRUD_list(token, `/api/vehicles/website/crudlist/${trackId}`);

export const getVehicleTypeList: (token: string) => Promise<VehicleType[]> = (token: string) => CRUD_list(token, '/api/vehicletype/website/');

/**
 * Extract a list of points of interest from the API
 * TODO: adjust path after implementation in backend.
 * @param token   The authentication token of the user requesting the list
 * @param trackId The track id for the track on which the POIs should be on.
 */
export const getPOIList: (token: string, track_id: number) => Promise<PointOfInterest[]> = (token: string) => CRUD_list(token, '/api/poi/website/');


/**
 * A generic CRUD listing function
 * @param token The authentication token of the user requesting the list
 * @param trunk The path on the backend where this list can be requested.
 */
const CRUD_list = (token: string, trunk: string) => {
    const auth_header_line = `Bearer ${token}`;
    const res = fetch(`${BACKEND_BASE_PATH}${trunk}`, {
        'method': 'GET',
        cache: 'no-store', headers:
            {
                "Authorization": auth_header_line
            }
    })
    const json_result = res.then(r => {
        if (r.ok)
            return r.json();
        else if (r.status == 401)
            throw new UnauthorizedError('Token expired')
        else
            throw new Error('Fetching Error', {cause: r});
    });
    return json_result;
}