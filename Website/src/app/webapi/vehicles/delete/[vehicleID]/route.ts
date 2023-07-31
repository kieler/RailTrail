import {apiError} from "@/utils/helpers";
import {NextRequest, NextResponse} from "next/server";
import {deleteVehicle} from "@/utils/data";
import {cookies} from "next/headers";


/**
 * Handle the HTTP DELETE method for the route /webapi/vehicles/delete/[vehicleID]
 *
 * @param _request        The request object. Not used
 * @param vehicleIDString The vehicleID part of the requested path. Automatically inserted by next.
 */
export async function DELETE(_request: NextRequest, {params: {vehicleID: vehicleIDString}}: {
    params: { vehicleID: string }
}) {
    // convert the vehicle ID to a number.
    const vehicleID = +vehicleIDString;

    // check if the vehicleID is a number
    if (isNaN(vehicleID)) {
        // If not, return a "Not Found" status
        console.log('Can not delete vehicle: ', vehicleIDString, 'is not a Number!');
        return apiError(404);
    }

    // obtain the token from the request cookies
    const token = cookies().get('token')?.value;

    if (token == undefined) {
        // return "Unauthorized" if the requester does not have a token.
        return apiError(401);
    }

    try {
        // try to delete the respective vehicle
        const res = await deleteVehicle(token, vehicleID);

        if (res.ok) {
            return NextResponse.json('OK')
        } else {
            return apiError(res.status);
        }
    } catch (e) {
        console.error('Cannot delete vehicle', vehicleID, '- Reason: ', e);
        return apiError(500);
    }

}