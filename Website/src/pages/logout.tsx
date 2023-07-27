import Login from "@/components/login";
import "@/components/globals.css";
import {GetServerSideProps, InferGetServerSidePropsType} from "next";
import {deleteCookie, hasCookie} from "cookies-next";
import Head from "next/head";
import {meta_info} from "@/lib/common";


export const getServerSideProps: GetServerSideProps<{
    success: boolean
}> = async ({req, res,}) => {
    let success = false;

    if (hasCookie('token', {
        httpOnly: true,
        sameSite: true,
        req, res
    })) {

        deleteCookie('token', {
            httpOnly: true,
            sameSite: true,
            req, res
        })
        success = true;
    }
    return {props: {success}};
}

export default function Page({success}: InferGetServerSidePropsType<typeof getServerSideProps>) {

    return (
        <main className="container mx-auto max-w-2xl grow">
            <Head>
                <title>{meta_info.title}</title>
                <meta name={'description'} content={meta_info.description}/>
            </Head>
            <div className={'bg-white dark:bg-slate-800 dark:text-white p-4 rounded'}>
                {success ? (<p>You are logged out!</p>) : (<p>You are not logged in</p>)}
                <Login
                    dst_url='/'
                />
            </div>
        </main>
    );
}
