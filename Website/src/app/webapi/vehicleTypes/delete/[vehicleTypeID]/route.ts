import {apiError} from "@/utils/helpers";
import {NextRequest, NextResponse} from "next/server";
import {deleteVehicle, deleteVehicleType} from "@/utils/data";
import {cookies} from "next/headers";


/**
 * Handling HTTP DELETE requests for vehicle types
 * @param _request An (unused) object representing the request that triggered this function
 * @param params The path parameters (the value inserted for [vehicleTypeID] in the path)
 */
export async function DELETE(_request: NextRequest, {params}: {params: {vehicleTypeID: string}}) {
    // cast the vehicle type to a number
    const vehicleTypeID = +params.vehicleTypeID;

    // check if the vehicleTypeID is a number
    if (isNaN(vehicleTypeID)) {
        console.log('Can not delete vehicle: ',params.vehicleTypeID, 'is not a Number!');
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
        const res = await deleteVehicleType(token, vehicleTypeID);

        // and process the response we get.
        if (res.ok) {
            return NextResponse.json('OK')
        }
        else {
            return apiError(res.status);
        }
    } catch (e) {
        // If we throw an error, log it and declare a server error.
        console.error('Cannot delete vehicle', vehicleTypeID, '- Reason: ', e);
        return apiError(500);
    }

}