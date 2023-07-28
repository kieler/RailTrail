import {
    AuthenticationRequest,
    AuthenticationResponse,
    InitResponse, PointOfInterest, TrackList,
    TrackPath,
    Vehicle, VehicleCrU, VehicleList, VehicleListItem, VehicleTypeCrU, VehicleTypeList, VehicleTypeListItem
} from "./api.website";
import {UnauthorizedError} from "@/lib/types";
import 'server-only'


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

export const updateVehicle = (token: string, track_id: number, payload: VehicleCrU) => CRUD_update(token, `/api/vehicles/website/${track_id}`, payload);

export const updateVehicleType = (token: string, payload: VehicleTypeCrU) => CRUD_update(token, '/api/vehicletype/website', payload);

export const updatePOI = (token: string, payload: VehicleCrU) => CRUD_update(token, '/api/poi/website', payload);


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

export const getVehicleList: (token: string, trackId: number) => Promise<VehicleList> = (token: string, trackId: number) => CRUD_list(token, `/api/vehicles/website/crudlist/${trackId}`);

export const getVehicleTypeList: (token: string) => Promise<VehicleTypeList> = (token: string) => CRUD_list(token, '/api/vehicletype/website/');

export const getPOIList: (token: string, trackId: number) => Promise<PointOfInterest[] | undefined> =
    (token: string, trackId: number) => (getInitData(token, trackId)
        .then(id => id?.pointsOfInterest
        ));


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