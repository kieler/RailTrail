import {AuthenticationRequest, AuthenticationResponse} from "@/lib/api.website";
import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";
import {authenticate} from "@/lib/data";

// export async function GET(request: NextRequest) {
//     return new NextResponse(null, { status: 405 })
// }

export async function POST(request: NextRequest) {
    const url = request.nextUrl.clone();
    console.log('baz', request.destination);
    const data = await request.formData();
    console.log('foo', data);
    url.pathname = data.get("dst_url")?.toString() || '/';
    console.log("new url", url)
    const username = data.get("username")?.toString()
    const password = data.get("password")?.toString()
    if (username && password) {
        const token = await authenticate(username, password);
        if (token) {
            cookies().set({
                name: 'token',
                value: token,
                sameSite: true,
                httpOnly: true
            });
            url.searchParams.set('success', 'true')
        }
        else {
            return new NextResponse("failed!")
        }
    }

    return NextResponse.redirect(url)
}