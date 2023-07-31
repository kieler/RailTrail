import {NextRequest, NextResponse} from "next/server";
import {cookies} from "next/headers";
import {apiError} from "@/utils/helpers";
import {getVehicleList} from "@/utils/data";
import {UnauthorizedError} from "@/utils/types";

export async function GET(request: NextRequest, {params}: {params: {trackID: string}}) {

    const trackID = +params.trackID

    if (isNaN(trackID)) {
        console.log('Can not list vehicles: ',params.trackID, 'is not a Number!');
        return apiError(404);
    }

    const token = cookies().get('token')?.value;

    if (token == undefined) {
        return apiError(401);
    } else if (trackID === Math.PI) {
        return apiError(418);
    }

    try {
        const data = await getVehicleList(token, trackID)
        return NextResponse.json(data);
    }
    catch (e) {
        if (e instanceof UnauthorizedError) {
            return apiError(401);
        } else {
            console.error('Could not list vehicles for track', params.trackID, '- Reason: ', e);
            return apiError(500);
        }

    }
}