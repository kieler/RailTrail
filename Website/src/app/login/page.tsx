import Login from "@/components/login";


export default function Home() {
  
    return (
            // <div className='h-full min-h-screen'>
                <main className="container mx-auto max-w-2xl grow">
                    <div className={'bg-white dark:bg-slate-800 dark:text-white p-4 rounded'}>
                        <Login/>
                    </div>
                </main>
            //</div>
    )
  }