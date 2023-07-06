import Login from "@/components/login";


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