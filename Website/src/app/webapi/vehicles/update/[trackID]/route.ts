import {NextRequest, NextResponse} from "next/server";
import {cookies} from "next/headers";
import {apiError} from "@/utils/helpers";
import {updatePOI, updateVehicle} from "@/utils/data";
import {VehicleCrU} from "@/utils/api.website";


export async function POST(request: NextRequest, {params}: {params: {trackID: string}}) {
    const trackID = +params.trackID

    if (isNaN(trackID)) {
        console.log('Can not update vehicle on track: ',params.trackID, 'is not a Number!');
        return apiError(404);
    }

    const token = cookies().get("token")?.value;
    const payload: VehicleCrU | undefined = await (request.json().catch(() => undefined));
    // console.log("requested track_id", track_id);

    if (token == undefined) {
        return apiError(401);
    }

    if (payload == undefined) {
        return apiError(400);
    }

    try {
        const res = await updateVehicle(token, trackID, payload);

        if (res.ok) {
            return new NextResponse(res.body, {status: res.status, statusText: res.statusText});
        } else {
            switch (res.status) {
                case 401:
                    return apiError(401);
                case 404:
                    return apiError(404);
                default:
                    console.log(res.status, 'Response:', await res.text())
                    return apiError(500);
            }
        }
    } catch (e) {
        console.error('Cannot post update', payload, '- Reason: ', e);
        return apiError(500);
    }


}