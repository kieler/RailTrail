import {NextRequest, NextResponse} from "next/server";
import {cookies} from "next/headers";
import {apiError} from "@/utils/helpers";
import {updatePOI, updateVehicle, updateVehicleType} from "@/utils/data";
import {VehicleTypeCrU} from "@/utils/api.website";


export async function POST(request: NextRequest, {params}: {params: {}}) {

    const token = cookies().get("token")?.value;
    const payload: VehicleTypeCrU | undefined = await (request.json().catch(() => undefined));
    // console.log("requested track_id", track_id);

    if (token == undefined) {
        return apiError(401);
    }

    if (payload == undefined) {
        return apiError(400);
    }

    try {
        const res = await updateVehicleType(token, payload);

        if (res.ok) {
            return new NextResponse(res.body, {status: res.status, statusText: res.statusText});
        } else {
            switch (res.status) {
                case 401:
                    return apiError(401);
                case 404:
                    return apiError(404);
                default:
                    return apiError(500);
            }
        }
    } catch (e) {
        console.error('Cannot post update', payload, '- Reason: ', e);
        return apiError(500);
    }


}