import {NextRequest, NextResponse} from "next/server";
import {createTrack} from "@/utils/data";
import {cookies} from "next/headers";
import {UnauthorizedError} from "@/utils/types";
import {apiError} from "@/utils/helpers";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const payload = await request.json()
    const token = cookies().get('token')?.value
    if (token) {
        try {
            console.log('Adding new track with token', token);
            const res = await createTrack(token, payload)
            if (res.ok) {
                return new NextResponse(res.body, {status: res.status, statusText: res.statusText})
            } else {
                return new NextResponse("Backend error", {status: 502})
            }
        } catch (e) {
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
            }
            else {
                return apiError(500);
            }
        }
    } else {
        return apiError(401);
    }
}