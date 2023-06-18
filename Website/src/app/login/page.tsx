import Login from "@/components/login";
import { Main } from "next/document"
import { cookies } from "next/headers";



export default function Home(x: any) {

    const searchParams = x.searchParams;

    console.log('x', searchParams)
    console.log('x', x)
  
    return (
            // <div className='h-full min-h-screen'>
                <main className="container">
                    <dialog open>
                        <Login/>
                    </dialog>
                </main>
            //</div>
    )
  }

export async function POST(x: any) {
    console.log('foo', x)

    return (
        <p>Hi!</p>
    )
}