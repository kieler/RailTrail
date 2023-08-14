import Link from "next/link";

export default function Header({username}: {username?: string}) {
        return (
        <header className={'flex flex-row w-full flex-initial justify-items-center mb-1.5 p-2'}>
            <p className={''}><Link href={'/'}>RailTrail Admin interface</Link></p>
            <div className={'grow'}/>
            {username ? <p> Hello {username} &ndash; <Link href={'/logout'} prefetch={false}>Logout</Link></p> :
                <p className={''}><Link href={'/login'}>Login</Link></p>}
        </header>
    );
}