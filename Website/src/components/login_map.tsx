"use client"
import {type IMapConfig, IMapRefreshConfig} from "@/lib/types";
import {PropsWithChildren, useState} from "react";
import {LoginDialog} from "@/components/login";
import DynamicMap from "@/components/dynmap";
import {SelectionDialog} from "@/components/track_selection";

const LoginMapWrapper = ({logged_in, track_selected, map_conf}: PropsWithChildren<{logged_in: boolean, track_selected: boolean, map_conf: IMapRefreshConfig}>) => {
    const [loginState, setLogin] = useState(logged_in);

    console.log('track selected', track_selected, map_conf.track_id)

    return <>
        {!loginState &&
            <LoginDialog dst_url='/map' login_callback={setLogin}>
                <p className="mb-1.5">You need to log in!</p>
            </LoginDialog>}
        {loginState && !track_selected && <SelectionDialog dst_url='/map' login_callback={setLogin}>
            <p className="mb-1.5">Please select a track!</p>
        </SelectionDialog> }
        <DynamicMap {...map_conf} logged_in={loginState} setLogin={setLogin}/>
    </>
}

export default LoginMapWrapper;