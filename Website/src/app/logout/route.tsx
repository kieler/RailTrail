import Login from "@/components/login";
import { Main } from "next/document"
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    console.log('x', request.nextUrl.searchParams)
    cookies().set({
        name: 'token',
        value: '',
        expires: new Date(0)
    })

    return new NextResponse("foo");
}


async function Site() {
  
    return (
        <body>
            <div className='h-full min-h-screen'>
                <main className="container">
                    <p>You are logged out!</p>
                    <dialog open>
                        <Login/>
                    </dialog>
                </main>
            </div>
        </body>
    )
  }