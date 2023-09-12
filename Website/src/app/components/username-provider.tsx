"use client";

import { createContext, PropsWithChildren } from "react";

/**
 * A react context hodling the username of the currently logged in user
 */
export const UsernameContext = createContext(undefined as undefined | string);

/**
 * Client component wrapper for the UsernameContext
 */
export default function UsernameProvider({ children, username }: PropsWithChildren<{ username: string | undefined }>) {
	return <UsernameContext.Provider value={username}>{children}</UsernameContext.Provider>;
}
