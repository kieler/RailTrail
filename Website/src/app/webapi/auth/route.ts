import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";
import {authenticate} from "@/utils/data";
import {NextURL} from "next/dist/server/web/next-url";
import {hostname} from "os";

/**
 * Handle submissions of the login form (in the `app/components/Login.tsx` component)
 * @param request The request sent. Username and password are expected as `application/x-www-form-urlencoded`
 *                with the fields:
 *                - `username`:           the entered username
 *                - `password`:           the entered password
 *                - `dst_url` (optional): the trunk where to redirect the user after processing.
 * @returns A response redirecting the user to /dst_url using a 303 status message or an error code.
 *          The redirect has the search-parameter `success` set to `"true"` if the login was successful,
 *          and set to `"false"` otherwise.
 */
export async function POST(request: NextRequest) {
    const base_host = request.headers.get('origin')

    const url = new NextURL('/', base_host ?? `https://${hostname()}`);

    const data = await request.formData();
    url.pathname = (data.get("dst_url") ?? '/') as string;

    const username = data.get("username")?.toString()
    const password = data.get("password")?.toString()
    if (!(username && password)) {
        return new NextResponse('Malformed Request', {status: 400});
    }
    try {
        const token = await authenticate(username, password, data.get('signup')?.toString() !== undefined);
        if (token) {
            cookies().set({
                name: 'token',
                value: token,
                sameSite: 'lax',
                httpOnly: true
            });
            url.searchParams.set('success', 'true');
            console.log("User:", username, 'login successful.');
        } else {
            console.log("User:", username, 'login failed.');
            url.searchParams.set('success', 'false');
        }
    } catch (e: any) {
        console.error("User:", username, 'server failure', e);
        return new NextResponse(`server error: ${e.toString()}`, {status: 500});
    }

    // redirect the user to the page they came from with a 303, so the user agent will request that page with a GET.
    return NextResponse.redirect(url, {status: 303});
}