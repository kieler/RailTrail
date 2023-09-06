"use client";
import { Dispatch, FunctionComponent, useState } from "react";
import { LoginDialog } from "@/app/components/login";
import { SelectionDialog } from "@/app/components/track_selection";

/**
 * Component wrapping some other component with a login- and track selection dialog and keeping track of login state.
 * @param logged_in         initial login state
 * @param track_selected    track selection state
 * @param map_conf          parameters for the construction of the child
 * @param Child             The wrapped React Component.
 */
function LoginWrapper<T extends object>({
	logged_in,
	track_selected,
	childConf,
	child: Child
}: {
	logged_in: boolean;
	track_selected: boolean;
	childConf: T;
	child: FunctionComponent<T & { logged_in: boolean; setLogin: Dispatch<boolean> }>;
}) {
	const [loginState, setLogin] = useState(logged_in);

	// console.log('track selected', track_selected, map_conf.track_id)

	return (
		<>
			{!loginState ? (
				<LoginDialog login_callback={setLogin}>
					<p className="mb-1.5">Sie müssen sich einloggen!</p>
				</LoginDialog>
			) : (
				!track_selected && (
					<SelectionDialog>
						<p className="mb-1.5">Bitte wählen Sie eine Strecke aus</p>
					</SelectionDialog>
				)
			)}
			<Child {...childConf} logged_in={loginState} setLogin={setLogin} />
		</>
	);
}

export default LoginWrapper;
