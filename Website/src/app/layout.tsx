import BaseLayout from "@/app/components/base_layout";
import { inter, meta_info } from "@/utils/common";
import { cookies } from "next/headers";
import { getUsername, inlineTry } from "@/utils/helpers";
import React from "react";
import UsernameProvider from "@/app/components/username-provider";

export const metadata = meta_info;

/**
 * The Layout to use on all pages in the app-directory.
 * Effectively defers to BaseLayout with minimal adjustments.
 */
export default function RootLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
	const token = cookies().get("token")?.value;
	const username = token ? inlineTry(() => getUsername(token)) : undefined;

	return (
		<html lang="de">
			<body className={inter.className}>
				<UsernameProvider username={username}>
					<BaseLayout>{children}</BaseLayout>
					{
						/* Add any modals beneath the page layout. They will need to layer themselves over the content. */
						modal
					}
				</UsernameProvider>
			</body>
		</html>
	);
}
