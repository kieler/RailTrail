import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";
import {authenticate} from "@/utils/data";
import {NextURL} from "next/dist/server/web/next-url";

// export async function GET(request: NextRequest) {
//     return new NextResponse(null, { status: 405 })
// }

export async function POST(request: NextRequest) {
    const url = request.nextUrl.clone();
    const base_host = request.headers.get('x-forwarded-host')

    console.log('request headers:', request.headers);

    // console.log('baz', request.destination);
    const data = await request.formData();
    // console.log('foo', data);
    url.pathname = data.get("dst_url")?.toString() || '/';
    // console.log("new url", url)
    const username = data.get("username")?.toString()
    const password = data.get("password")?.toString()
    if (username && password) {
        try {
            const token = await authenticate(username, password, data.get('signup')?.toString());
            if (token) {
                cookies().set({
                    name: 'token',
                    value: token,
                    sameSite: 'lax',
                    httpOnly: true
                });
                url.searchParams.set('success', 'true')
                console.log("User:", username, 'login successful.');
            } else {
                console.log("User:", username, 'login failed.');
                return new NextResponse("failed!")
            }
        } catch (e: any) {
            console.error("User:", username, 'server failure', e);
            return new NextResponse(`server error: ${e.toString()}`, {status: 500});
        }
    } else {
        return new NextResponse('Malformed Request', {status: 400});
    }

    return NextResponse.redirect(new NextURL(url, {base: base_host ?? undefined}))
}