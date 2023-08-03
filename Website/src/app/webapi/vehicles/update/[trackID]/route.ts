import {NextRequest, NextResponse} from "next/server";
import {cookies} from "next/headers";
import {apiError} from "@/utils/helpers";
import {updatePOI, updateVehicle} from "@/utils/data";
import {UpdateVehicle} from "@/utils/api";

/**
 * Handles vehicle data update requests from the client by proxying them to the backend.
 * No real error checking/input validation is done.
 *
 * @param request       An object representing the request that triggered this function.
 * @param trackIDString The [trackID] path of the requested route.
 */
export async function POST(request: NextRequest, {params: {trackID: trackIDString}}: { params: { trackID: string } }) {
    // convert the trackID into a number
    const trackID = +trackIDString

    // check if the conversion was successful
    if (isNaN(trackID)) {
        // If not, it wasn't a number, so we return a "not found" response
        console.log('Can not update vehicle on track:', trackIDString, 'is not a Number!');
        return apiError(404);
    }

    // obtain the access token from the request cookies ...
    const token = cookies().get("token")?.value;
    // and obtain the json expected to be in the body of the request, setting it undefined on errors.
    const payload: UpdateVehicle | undefined = await (request.json().catch(() => undefined));
    // console.log("requested track_id", track_id);

    // check if the user has an authentication token
    if (token == undefined) {
        return apiError(401);
    }
    // and check if the request body was valid
    if (payload == undefined) {
        return apiError(400);
    }

    try {
        // send the payload from the request to the backend
        const res = await updateVehicle(token, trackID, payload);

        // and interpret the response
        if (res.ok) {
            // I'm not entirely certain what the backend responds with, so a 2XX response is
            // treated as a success, and the actual response, and status code are proxied.
            return new NextResponse(res.body, {status: res.status, statusText: res.statusText});
        } else {
            switch (res.status) {
                //
                case 400:
                    return apiError(400);
                case 401:
                    return apiError(401);
                case 404:
                    return apiError(404);
                default:
                    console.log('Vehicle update for track', trackIDString, 'failed with', res.status, 'Response:', await res.text())
                    return apiError(500);
            }
        }
    } catch (e) {
        console.error('Cannot post update', payload, 'for track', trackIDString, '- Reason: ', e);
        return apiError(500);
    }


}