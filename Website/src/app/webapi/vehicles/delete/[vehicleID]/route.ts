import {apiError} from "@/lib/helpers";
import {NextRequest, NextResponse} from "next/server";
import {deleteVehicle} from "@/lib/data";
import {cookies} from "next/headers";


export async function DELETE(_request: NextRequest, {params}: {params: {vehicleID: string}}) {
    const vehicleID = +params.vehicleID;

    // check if the vehicleID is a number
    if (isNaN(vehicleID)) {
        console.log('Can not delete vehicle: ',params.vehicleID, 'is not a Number!');
        return apiError(404);
    }

    const token = cookies().get('token')?.value;

    if (token == undefined) {
        return apiError(401);
    }

    try {
        const res = await deleteVehicle(token, vehicleID);

        if (res.ok) {
            return NextResponse.json('OK')
        }
        else {
            return apiError(res.status);
        }
    } catch (e) {
        console.error('Cannot delete vehicle', vehicleID, '- Reason: ', e);
        return apiError(500);
    }

}