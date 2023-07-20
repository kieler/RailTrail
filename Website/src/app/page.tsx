import Image from 'next/image'
import Footer from "@/app/components/footer";
import Link from "next/link";
import Header from "@/app/components/header";

export default function Home() {
    return (
        <main className="max-w-xl items-center mx-auto grow">
            <p>This website offers some administrative thingies:</p>
            <ul className={'list-disc list-inside my-2'}>
                <li>Current vehicle positions: <Link className="text-blue-600 visited:text-purple-700"
                                                     href={'/map'}>here</Link></li>
                <li>Add a track <Link className="text-blue-600 visited:text-purple-700"
                                      href={'/add_track'}>here</Link></li>
                <li>Select a different track <Link className="text-blue-600 visited:text-purple-700"
                                      href={'/select_track'}>here</Link></li>
                <li>Login <Link className="text-blue-600 visited:text-purple-700"
                                      href={'/login'}>here</Link></li>
                <li>Logout <Link className="text-blue-600 visited:text-purple-700"
                                href={'/logout'} prefetch={false}>here</Link></li>
                <li>Create a new user <Link className="text-blue-600 visited:text-purple-700"
                                href={'/signup'}>here</Link> (temporary)</li>
            </ul>
        </main>
    )
}
