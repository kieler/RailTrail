/**
 * Offer an endpoint to call in order to request a track list positions. This will
 * read the auth token from the cookie, so we don't need to access it on the client
 */

import {getTrackList, getVehicleData} from "@/utils/data";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {UnauthorizedError} from "@/utils/types";

export async function GET(request: NextRequest) {
    // console.log("foobar", request)
    const token = cookies().get("token")?.value;
    // console.log("requested track_id", track_id);

    if (token) {
        try {
            const tracks = await getTrackList(token);
            // console.log("vehicles", vehicles)
            return NextResponse.json(tracks)
        }
        catch (e: any) {
            if (e instanceof UnauthorizedError) {
                // token may have expired. Delete token.
                cookies().set({
                    name: 'token',
                    value: '',
                    sameSite: 'lax',
                    httpOnly: true,
                    expires: new Date(0)
                })
                console.log('UnauthorizedError')
                return new NextResponse('Unauthorized', {status: 401})
            } else
                return new NextResponse("Error" + e.toString(), {status: 500})
        }
    }
    else {
        return new NextResponse("Unauthorized", {status: 401})
    }

}