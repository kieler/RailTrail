import Selection from "@/components/track_selection";

export default function Page() {
    return (
        // <div className='h-full min-h-screen'>
        <main className="container mx-auto max-w-2xl grow">
            <div className={'bg-white p-4 rounded'}>
                <Selection/>
            </div>
        </main>
    );
}