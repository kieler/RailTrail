import {NextRequest, NextResponse} from "next/server";
import {cookies} from "next/headers";
import {apiError} from "@/utils/helpers";
import {getAllVehicles} from "@/utils/data";
import {UnauthorizedError} from "@/utils/types";

/**
 * Returns a list of vehicles on a track as response to a GET request.
 *
 * @param request      An object representing the request that triggered this function.
 */
export async function GET(request: NextRequest) {

    // obtain the access token from the request cookies
    const token = request.cookies.get('token')?.value;

    // check if the user has a token.
    if (token == undefined) {
        return apiError(401);
    }

    try {
        // obtain a list of vehicles from the backend server
        const data = await getAllVehicles(token)
        // and return it to the requesting client.
        return NextResponse.json(data);
    } catch (e) {
        // An UnauthorizedError is thrown when the backend responds with a 401.
        if (e instanceof UnauthorizedError) {
            // token may have expired. Delete token.
            cookies().set({
                name: 'token',
                value: '',
                sameSite: 'lax',
                httpOnly: true,
                expires: new Date(0)
            })
            return apiError(401);
        } else {
            console.error('Could not list all vehicles - Reason: ', e);
            return apiError(500);
        }

    }
}