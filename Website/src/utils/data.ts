/**
 * A collection on functions that relate to fetching data from the backend.
 */

import {AuthenticationRequest, AuthenticationResponse,} from "./api.website";
import {
    CreatePOIType,
    FullTrack,
    PointOfInterest,
    POIType,
    Tracker,
    TrackList,
    UpdatePointOfInterest,
    UpdateTrack,
    UpdateVehicle,
    UpdateVehicleType,
    Vehicle,
    VehicleType
} from "@/utils/api";
import {UnauthorizedError} from "@/utils/types";
import 'server-only'

/** The base path from which the webserver process can reach the backend server. */
const BACKEND_BASE_PATH = process.env['BACKEND_URI']

/******************************************************************************/
/*                          SECTION: user management                          */

/******************************************************************************/

/**
 * Tries to authenticate to the backend using the given username and password.
 * @param username The username used in authentication.
 * @param password The password for the authentication.
 * @param signup True if this function should communicate with the temporary signup endpoint.
 */
export async function authenticate(username: string, password: string, signup?: boolean): Promise<string | undefined> {

    // construct an authentication request
    const auth_msg: AuthenticationRequest = {username: username, password: password};
    const auth_resp_json = await fetch(signup ? `${BACKEND_BASE_PATH}/api/signup` : `${BACKEND_BASE_PATH}/api/login`, {
        method: "POST", body: JSON.stringify(auth_msg), headers: {
            "Content-Type": "application/json",
        },
    });
    if (auth_resp_json.ok) {
        const auth_resp: AuthenticationResponse = await auth_resp_json.json();
        return auth_resp.token;
    }
    return;
}

/******************************************************************************/
/*                            SECTION: map/list foo                           */

/******************************************************************************/

export async function getTrackList(token: string) {
    const auth_header_line = `Bearer ${token}`
    const x = await fetch(`${BACKEND_BASE_PATH}/api/track`, {
        cache: 'no-store',
        method: 'get',
        headers: {"authorization": auth_header_line}
    })
    if (x.ok) {
        const data: TrackList = await x.json();
        return data
    } else if (x.status == 401) {
        throw new UnauthorizedError('Token expired');
    } else {
        console.log("Could not fetch vehicle positions (server)", x.status, x.statusText)
        return [];
    }
}

export async function getTrackData(token: string, track_id: number) {
    const auth_header_line = `Bearer ${token}`
    const x = await fetch(`${BACKEND_BASE_PATH}/api/track/${track_id}`, {
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
        console.log("Could not fetch track data (server):", x.status, x.statusText)
        return;
    }
}

/******************************************************************************/
/*                               SECTION:  CRUD                               */
/******************************************************************************/

/******************************************************************************/
/*                               SUBSECTION:  C                               */
/******************************************************************************/

export const createTrack = (token: string, payload: UpdateTrack) => CRUD_create(token, '/api/track', payload);

/**
 * Specialized create function for Vehicles
 *
 * Essentially a wrapper around CRUD_create
 *
 * @param token     The authentication token of the user initiating the action
 * @param payload   The data with which the vehicle is created
 */
export const createVehicle = (token: string, payload: UpdateVehicle) => CRUD_create(token, '/api/vehicles', payload);

/**
 * Specialized create function for VehicleTypes
 *
 * Essentially a wrapper around CRUD_create
 *
 * @param token    The authentication token of the user initiating the action
 * @param payload  The data with which the vehicle type is created
 */
export const createVehicleType = (token: string, payload: UpdateVehicleType) => CRUD_create(token, '/api/vehicletype', payload);

/**
 * Specialized create function for Points of Interest
 *
 * Essentially a wrapper around CRUD_create
 *
 * @param token    The authentication token of the user initiating the action
 * @param payload  The data with which the point of interest is created
 */
export const createPOI = (token: string, payload: UpdatePointOfInterest) => CRUD_create(token, '/api/poi', payload);

/**
 * Specialized create function for Points of Interest types
 *
 * Essentially a wrapper around CRUD_create
 *
 * @param token    The authentication token of the user initiating the action
 * @param payload  The data with which the point of interest type is created
 */
export const createPOIType = (token: string, payload: CreatePOIType) => CRUD_create(token, '/api/poitype', payload);

/**
 * Specialized create function for Tracker
 *
 * Essentially a wrapper around CRUD_create
 *
 * @param token    The authentication token of the user initiating the action
 * @param payload  The data with which the tracker is created
 */
export const createTracker = (token: string, payload: Tracker) => CRUD_create(token, '/api/tracker', payload);

/**
 * A generic CRUD create function
 * @param token   The authentication token of the user initiating the update
 * @param trunk   The path on the backend where the update belongs
 * @param payload The data to be sent to the backend. MUST be JSON serializable.
 */
function CRUD_create(token: string, trunk: string, payload: any) {
    const auth_header_line = `Bearer ${token}`;
    return fetch(`${BACKEND_BASE_PATH}${trunk}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        cache: 'no-store',
        headers: {
            "content-type": "application/json",
            "authorization": auth_header_line,
        }
    });
}

/******************************************************************************/
/*                               SUBSECTION:  U                               */
/******************************************************************************/

/**
 * Specialized update function for Vehicles
 *
 * Essentially a wrapper around CRUD_update
 *
 * @param token     The authentication token of the user initiating the update
 * @param vehicleId The ID of the vehicle to update
 * @param payload   The data with which the vehicle is updated
 */
export const updateVehicle = (token: string, vehicleId: number, payload: UpdateVehicle) => CRUD_update(token, `/api/vehicles/${vehicleId}`, payload);

/**
 * Specialized update function for VehicleTypes
 *
 * Essentially a wrapper around CRUD_update
 *
 * @param token    The authentication token of the user initiating the update
 * @param typeID   The ID of the vehicle type to update
 * @param payload  The data with which the vehicle type is updated
 */
export const updateVehicleType = (token: string, typeID: number, payload: UpdateVehicleType) => CRUD_update(token, `/api/vehicletype/${typeID}`, payload);

/**
 * Specialized update function for Points of Interest
 *
 * Essentially a wrapper around CRUD_update
 *
 * @param token    The authentication token of the user initiating the update
 * @param poiID    The ID of the point of interest to update
 * @param payload  The data with which the point of interest is updated
 */
export const updatePOI = (token: string, poiID: number, payload: UpdatePointOfInterest) => CRUD_update(token, `/api/poi/${poiID}`, payload);

/**
 * Specialized update function for Points of Interest types
 *
 * Essentially a wrapper around CRUD_update
 *
 * @param token    The authentication token of the user initiating the update
 * @param typeID   The ID of the point of interest type to update
 * @param payload  The data with which the point of interest type is updated
 */
export const updatePOIType = (token: string, typeID: number, payload: CreatePOIType) => CRUD_update(token, `/api/poitype/${typeID}`, payload);

/**
 * Specialized update function for Tracker
 *
 * Essentially a wrapper around CRUD_create
 *
 * @param token    The authentication token of the user initiating the action
 * @param trackerID   The ID of the point of interest type to update
 * @param payload  The data with which the tracker is updated
 */
export const updateTracker = (token: string, trackerID: string, payload: Tracker) => {
    // url encode any weird characters in the tracker id
    const safeTrackerId = encodeURIComponent(trackerID);
    // then update
    return CRUD_update(token, `/api/tracker/${safeTrackerId}`, payload);
}

/**
 * A generic CRUD update function
 * @param token   The authentication token of the user initiating the update
 * @param trunk   The path on the backend where the update belongs
 * @param payload The data to be sent to the backend. MUST be JSON serializable.
 */
function CRUD_update(token: string, trunk: string, payload: any) {
    const auth_header_line = `Bearer ${token}`;
    return fetch(`${BACKEND_BASE_PATH}${trunk}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        cache: 'no-store',
        headers: {
            "content-type": "application/json",
            "authorization": auth_header_line,
        }
    });
}

/******************************************************************************/
/*                               SUBSECTION:  D                               */
/******************************************************************************/

export const deleteVehicle = (token: string, vehicleId: number) => CRUD_delete(token, `/api/vehicles/${vehicleId}`);

export const deleteVehicleType = (token: string, vehicleTypeId: number) => CRUD_delete(token, `/api/vehicletype/${vehicleTypeId}`);

export const deletePOI = (token: string, poiId: number) => CRUD_delete(token, `/api/poi/${poiId}`);

export const deletePOIType = (token: string, poiTypeId: number) => CRUD_delete(token, `/api/poitype/${poiTypeId}`);

export const deleteTracker = (token: string, trackerId: string) => {
    // url encode any weird characters in the tracker id
    const safeTrackerId = encodeURIComponent(trackerId);
    // then delete
    return CRUD_delete(token, `/api/tracker/${safeTrackerId}`);
};


/**
 * A generic CRUD delete function
 * @param token   The authentication token of the user initiating the deletion
 * @param trunk   The path on the backend where the deletion belongs
 */
const CRUD_delete = (token: string, trunk: string) => {
    const auth_header_line = `Bearer ${token}`;
    return fetch(`${BACKEND_BASE_PATH}${trunk}`, {
        method: 'DELETE',
        cache: 'no-store',
        headers: {"authorization": auth_header_line}
    });
}

/******************************************************************************/
/*                               SUBSECTION:  R                               */
/******************************************************************************/

/******************************************************************************/
/*                          SUBSUBSECTION:  Read all                          */
/******************************************************************************/


export const getAllVehicles: (token: string) => Promise<Vehicle[]> = (token: string) => CRUD_readAll(token, '/api/vehicles');

export const getAllVehicleTypes: (token: string) => Promise<VehicleType[]> = (token: string) => CRUD_readAll(token, '/api/vehicletype');

/**
 * Extract a list of points of interest from the API
 * @param token   The authentication token of the user requesting the list
 */
export const getAllPOIs: (token: string) => Promise<PointOfInterest[]> = (token: string) => CRUD_readAll(token, '/api/poi');

export const getAllPOITypes: (token: string) => Promise<POIType[]> = (token: string) => CRUD_readAll(token, '/api/poitype');

export const getAllTrackers: (token: string) => Promise<Tracker[]> = (token: string) => CRUD_readAll(token, '/api/tracker');

/**
 * A generic CRUD listing function
 * @param token The authentication token of the user requesting the list
 * @param trunk The path on the backend where this list can be requested.
 */
const CRUD_readAll = async (token: string, trunk: string) => {
    const auth_header_line = `Bearer ${token}`;
    const res = await fetch(`${BACKEND_BASE_PATH}${trunk}`, {
        'method': 'GET',
        cache: 'no-store', headers:
            {
                "Authorization": auth_header_line
            }
    })
    if (res.ok)
        return res.json();
    else if (res.status == 401)
        throw new UnauthorizedError('Token expired')
    else
        throw new Error('Fetching Error', {cause: res});
}

/******************************************************************************/
/*                      SUBSUBSECTION: Read all on track                      */
/******************************************************************************/

export const getAllVehiclesOnTrack: (token: string, track_id: number) => Promise<Vehicle[]> = (token: string, track_id: number) => CRUD_readAll(token, `/api/track/${track_id}/vehicles`)

export const getAllPOIsOnTrack: (token: string, track_id: number) => Promise<PointOfInterest[]> = (token: string, track_id: number) => CRUD_readAll(token, `/api/track/${track_id}/pois`)