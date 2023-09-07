import BaseLayout from "@/app/components/base_layout";
import { inter, meta_info } from "@/utils/common";
import { cookies } from "next/headers";
import { getUsername, inlineTry } from "@/utils/helpers";
import React from "react";

export const metadata = meta_info;

/**
 * The Layout to use on all pages in the app-directory.
 * Effectively defers to BaseLayout with minimal adjustments.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
	const token = cookies().get("token")?.value;
	const username = token ? inlineTry(() => getUsername(token)) : undefined;

	return (
		<html lang="en">
			<body className={inter.className}>
				<BaseLayout username={username}>{children}</BaseLayout>
			</body>
		</html>
	);
}
