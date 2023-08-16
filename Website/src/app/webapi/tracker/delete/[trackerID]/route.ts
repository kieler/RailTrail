import {apiError} from "@/utils/helpers";
import {NextRequest, NextResponse} from "next/server";
import {deleteTracker} from "@/utils/data";
import {cookies} from "next/headers";


/**
 * Handling HTTP DELETE requests for vehicle types
 * @param _request An (unused) object representing the request that triggered this function
 * @param params The path parameters (the value inserted for [trackerID] in the path)
 */
export async function DELETE(_request: NextRequest, {params}: {
    params: {
        trackerID: string
    }
}) {
    const trackerID = params.trackerID;

    // check if the trackerID is empty
    if (!trackerID) {
        console.log('Can not delete vehicle: Tracker ID is empty!');
        return apiError(404);
    }

    // obtain the authentication token from the request cookies
    const token = cookies().get('token')?.value;

    // If it is missing, the user is not logged in.
    if (token == undefined) {
        return apiError(401);
    }

    try {
        // initiate a deletion request on the backend
        const res = await deleteTracker(token, trackerID);

        // and process the response we get.
        if (res.ok) {
            return NextResponse.json('OK')
        } else {
            return apiError(res.status);
        }
    } catch (e) {
        // If we throw an error, log it and declare a server error.
        console.error('Cannot delete vehicle', trackerID, '- Reason: ', e);
        return apiError(500);
    }

}