import Link from "next/link";
import {actionAsyncStorage} from "next/dist/server/app-render/entry-base";

export default function Header() {

    return (<header className={'flex flex-row w-full flex-initial justify-items-center mb-1.5'}>
        <p className={''}><Link href={'/'}>RailTrail Admin interface</Link></p>
        <div className={'grow'}/>
        <p className={''}><Link href={'/login'}>Login</Link> | <Link href={'/logout'} prefetch={false}>Logout</Link></p>
    </header>)
}