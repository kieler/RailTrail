"use client"
import {IMapRefreshConfig} from "@/utils/types";
import {useState} from "react";
import {LoginDialog} from "@/app/components/login";
import {SelectionDialog} from "@/app/components/track_selection";

/**
 * Component wrapping some other component with a login- and track selection dialog and keeping track of login state.
 * @param logged_in         initial login state
 * @param track_selected    track selection state
 * @param map_conf          parameters for the construction of the child
 * @param child             Function contructing the wrapped React Component.
 */
const LoginWrapper = ({logged_in, track_selected, map_conf, child}: {logged_in: boolean, track_selected: boolean, map_conf: IMapRefreshConfig, child: (conf: IMapRefreshConfig) => JSX.Element}) => {
    const [loginState, setLogin] = useState(logged_in);

    // console.log('track selected', track_selected, map_conf.track_id)

    return <>
        {!loginState &&
            <LoginDialog login_callback={setLogin}>
                <p className="mb-1.5">You need to log in!</p>
            </LoginDialog>}
        {loginState && !track_selected && <SelectionDialog>
            <p className="mb-1.5">Please select a track!</p>
        </SelectionDialog> }
        {child({...map_conf, logged_in: loginState, setLogin: setLogin})}
    </>
}

export default LoginWrapper;