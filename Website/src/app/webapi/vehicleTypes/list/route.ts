import {NextRequest, NextResponse} from "next/server";
import {cookies} from "next/headers";
import {apiError} from "@/lib/helpers";
import {getVehicleList, getVehicleTypeList} from "@/lib/data";
import {UnauthorizedError} from "@/lib/types";

export async function GET(request: NextRequest, {params}: {params: {}}) {

    const token = cookies().get('token')?.value;

    if (token == undefined) {
        return apiError(401);
    }

    try {
        const data = await getVehicleTypeList(token)
        return NextResponse.json(data);
    }
    catch (e) {
        if (e instanceof UnauthorizedError) {
            return apiError(401);
        } else {
            console.error('Could not list vehicles types - Reason: ', e);
            return apiError(500);
        }

    }
}