import {NextResponse} from 'next/server';
import {NextRequest} from 'next/server';

/**
 * A simple middleware that will log incoming requests and the corresponding response code.
 * @param request The request that reached this server.
 */
export function middleware(request: NextRequest) {
    const response: NextResponse = NextResponse.next()

    console.log('HTTP', request.method, request.nextUrl.toString(), 'from', request.ip ?? request.headers.get('x-forwarded-for'), '-- Response:', response.status);

    return response;
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
     * Match all request paths except for the ones starting with:
     * - webapi (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
        '/((?!webapi|_next/static|_next/image|favicon.ico).*)',
    ],
};