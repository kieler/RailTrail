import {NextRequest, NextResponse} from "next/server";
import {cookies} from "next/headers";
import {apiError} from "@/utils/helpers";
import {updateTracker} from "@/utils/data";
import {Tracker} from "@/utils/api";


/**
 * Handles vehicle type data update requests from the client by proxying them to the backend.
 * No real error checking/input validation is done.
 *
 * @param request       An object representing the request that triggered this function.
 * @param params The path parameters (the value inserted for [trackerID] in the path)
 */
export async function PUT(request: NextRequest, {params}: {params: {trackerID: string}}) {

    // cast the vehicle type to a number
    const trackerID = +params.trackerID;

    // check if the vehicleTypeID is a number
    if (isNaN(trackerID)) {
        console.log('Can not delete vehicle: ',params.trackerID, 'is not a Number!');
        return apiError(404);
    }

    // obtain the auth token from the request cookies ...
    const token = cookies().get("token")?.value;
    // and the payload from the request body. Errors in json decoding will cause this to return undefined.
    const payload: Tracker | undefined = await (request.json().catch(() => undefined));
    // console.log("requested track_id", track_id);

    // check for the presence of an auth token ...
    if (token == undefined) {
        return apiError(401);
    }
    // and for the presence of plausible update data ...
    if (payload == undefined) {
        return apiError(400);
    }

    try {
        // then send the update data to the backend
        const res = await updateTracker(token, trackerID, payload);

        // and send the respective response.
        if (res.ok) {
            // I'm not entirely certain what the backend responds with, so a 2XX response is
            // treated as a success, and the actual response, and status code are proxied.
            return new NextResponse(res.body, {status: res.status, statusText: res.statusText});
        } else {
            switch (res.status) {
                case 401:
                    return apiError(401);
                case 404:
                    return apiError(404);
                default:
                    return apiError(500);
            }
        }
    } catch (e) {
        console.error('Cannot post update', payload, '- Reason: ', e);
        return apiError(500);
    }


}