import Login from "@/components/login";
import {GetServerSideProps, InferGetServerSidePropsType} from "next";
import {deleteCookie, hasCookie} from "cookies-next";
import RootLayout from "@/components/layout"
import {ReactElement} from "react";


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
        <div className='h-full min-h-screen'>
            <main className="container">
                {success ? (<p>You are logged out!</p>) : (<p>You are not logged in</p>)}
                <dialog open>
                    <Login
                        dst_url='/'
                    />
                </dialog>
            </main>
        </div>
    );
}

Page.getLayout = function getLayout(page: ReactElement) {
    return (
        <RootLayout>
            {page}
        </RootLayout>
    );
}
