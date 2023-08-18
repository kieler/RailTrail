import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {apiError} from "@/utils/helpers";
import {getAllPOITypes, getAllVehicleTypes} from "@/utils/data";
import {UnauthorizedError} from "@/utils/types";

/**
 * Handle HTTP GET requests to /webapi/vehicleTypes/list
 */
export async function GET() {

    // obtain the authentication token from the request
    const token = cookies().get('token')?.value;

    // Check if the user is logged in. The real check for this is done by the backend.
    if (token == undefined) {
        return apiError(401);
    }

    try {
        // then request the list of vehicle types from the backend
        const data = await getAllPOITypes(token)
        // and return it to the client
        return NextResponse.json(data);
    }
    catch (e) {
        // Also handle errors. An UnauthorizedError is thrown when the backend responds with a 401,
        // i.e. the users token is invalid.
        if (e instanceof UnauthorizedError) {
            return apiError(401);
        } else {
            // Other errors are logged, and the user gets a 500 response
            console.error('Could not list vehicles types - Reason: ', e);
            return apiError(500);
        }

    }
}