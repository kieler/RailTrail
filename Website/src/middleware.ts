import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    console.log("Hi!")
    if (request.headers.get('Content-Type') == 'application/x-www-form-urlencoded') {
        console.log("Foo!");
        const body = await request.formData();
        console.log(body);
        const headers = request.headers;
        headers.set('Content-Type', 'application/json')
        const req = new NextRequest(request.nextUrl,
            {
                body: JSON.stringify(body),
                referrer: request.referrer,
                ip: request.ip,
                headers: headers,
                method: request.method
            }
        );
        // (await request.formData()).delete('');
        return NextResponse.next({ request: req })
    }
    return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: '/login',
};