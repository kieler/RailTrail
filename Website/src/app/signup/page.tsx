import Login from "@/components/login";


export default function Home(x: any) {
  
    return (
            // <div className='h-full min-h-screen'>
                <main className="container mx-auto max-w-2xl grow">
                    <div className={'bg-white p-4 rounded'}>
                        <Login signup={true}/>
                    </div>
                </main>
            //</div>
    )
  }