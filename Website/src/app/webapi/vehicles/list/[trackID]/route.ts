import {NextRequest, NextResponse} from "next/server";
import {cookies} from "next/headers";
import {apiError} from "@/utils/helpers";
import {getVehicleList} from "@/utils/data";
import {UnauthorizedError} from "@/utils/types";

/**
 * Returns a list of vehicles on a track as response to a GET request.
 *
 * @param _request      An object representing the request that triggered this function. not used here.
 * @param trackIDString The [trackID] path of the requested route.
 */
export async function GET(_request: NextRequest, {params: {trackID: trackIDString}}: { params: { trackID: string } }) {
    // convert the trackID into a number
    const trackID = +trackIDString

    // check if the conversion was successful
    if (isNaN(trackID)) {
        // If not, it wasn't a number, so we return a "not found" response
        console.log('Can not list vehicles:', trackIDString, 'is not a Number!');
        return apiError(404);
    }

    // obtain the access token from the request cookies
    const token = cookies().get('token')?.value;

    // check if the user has a token.
    if (token == undefined) {
        return apiError(401);
    } else if (trackID === Math.PI) {
        return apiError(418);
    }

    try {
        // obtain a list of vehicles from the backend server
        const data = await getVehicleList(token, trackID)
        // and return it to the requesting client.
        return NextResponse.json(data);
    } catch (e) {
        // An UnauthorizedError is thrown when the backend responds with a 401.
        if (e instanceof UnauthorizedError) {
            return apiError(401);
        } else {
            console.error('Could not list vehicles for track', trackIDString, '- Reason: ', e);
            return apiError(500);
        }

    }
}