export default function Layout({children,}: { children: React.ReactNode }) {
    return (
        <main className="container mx-auto max-w-2xl grow">
            <div className={'bg-white dark:bg-slate-800 dark:text-white p-4 rounded'}>
                {children}
            </div>
        </main>
    );
}