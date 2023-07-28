import {NextRequest, NextResponse} from "next/server";
import {sendTrack} from "@/lib/data";
import {cookies} from "next/headers";
import {UnauthorizedError} from "@/lib/types";

export async function PUT(request: NextRequest, x: any, y: any, z: any) {
    const payload = await request.json()
    const token = cookies().get('token')?.value
    if (token) {
        try {
            console.log('Adding new track with token', token);
            const newID = await sendTrack(token, payload)
            if (newID) {
                return new NextResponse(newID, {status: 200})
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
                return new NextResponse('Unauthorized', {status: 401})
            }
        }
    } else {
        return new NextResponse("Unauthorized", {status: 401})
    }
}