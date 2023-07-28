import {apiError} from "@/lib/helpers";
import {NextRequest, NextResponse} from "next/server";
import {deleteVehicle, deleteVehicleType} from "@/lib/data";
import {cookies} from "next/headers";


export async function DELETE(_request: NextRequest, {params}: {params: {vehicleTypeID: string}}) {
    const vehicleTypeID = +params.vehicleTypeID;

    // check if the vehicleTypeID is a number
    if (isNaN(vehicleTypeID)) {
        console.log('Can not delete vehicle: ',params.vehicleTypeID, 'is not a Number!');
        return apiError(404);
    }

    const token = cookies().get('token')?.value;

    if (token == undefined) {
        return apiError(401);
    }

    try {
        const res = await deleteVehicleType(token, vehicleTypeID);

        if (res.ok) {
            return NextResponse.json('OK')
        }
        else {
            return apiError(res.status);
        }
    } catch (e) {
        console.error('Cannot delete vehicle', vehicleTypeID, '- Reason: ', e);
        return apiError(500);
    }

}