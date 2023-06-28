"use client"
import {type IMapConfig, IMapRefreshConfig} from "@/lib/types";
import {PropsWithChildren, useState} from "react";
import {LoginDialog} from "@/components/login";
import DynamicMap from "@/components/dynmap";

const LoginMapWrapper = ({logged_in, map_conf}: PropsWithChildren<{logged_in: boolean, map_conf: IMapRefreshConfig}>) => {
    const [loginState, setLogin] = useState(logged_in);

    return <>
        {!loginState && <LoginDialog description="You need to log in!" dst_url='/map' login_callback={setLogin}/>}
        <DynamicMap {...map_conf} logged_in={loginState}/>
    </>
}

export default LoginMapWrapper;