/**
 * Offer an endpoint to call in order to request new vehicle positions. This will
 * read the auth token from the cookie, so we don't need to access it on the client
 */

import { AuthenticationRequest, AuthenticationResponse } from "@/lib/api.website";
import { getVehicleData } from "@/lib/data";
import { STATUS_CODES } from "http";
import { redirect } from "next/dist/server/api-utils";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    // console.log("foobar", request)
    const token = cookies().get("token")?.value;
    const track_id: number = (await request.json()).track_id;
    // console.log("requested track_id", track_id);

    if (token) {
        const vehicles = await getVehicleData(token, track_id);
        // console.log("vehicles", vehicles)
        return new NextResponse(JSON.stringify(vehicles), {headers: {"Content-Type": "application/json"}})
    }
    else {
        return new NextResponse("Unauthorized", {status: 401})
    }

}