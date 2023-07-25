"use client"
import {IMapRefreshConfig} from "@/lib/types";
import {useState} from "react";
import {LoginDialog} from "@/components/login";
import {SelectionDialog} from "@/components/track_selection";

const LoginWrapper = ({logged_in, track_selected, map_conf, child}: {logged_in: boolean, track_selected: boolean, map_conf: IMapRefreshConfig, child: (conf: IMapRefreshConfig) => JSX.Element}) => {
    const [loginState, setLogin] = useState(logged_in);

    // console.log('track selected', track_selected, map_conf.track_id)

    return <>
        {!loginState &&
            <LoginDialog login_callback={setLogin}>
                <p className="mb-1.5">You need to log in!</p>
            </LoginDialog>}
        {loginState && !track_selected && <SelectionDialog login_callback={setLogin}>
            <p className="mb-1.5">Please select a track!</p>
        </SelectionDialog> }
        {child({...map_conf, logged_in: loginState, setLogin: setLogin})}
    </>
}

export default LoginWrapper;