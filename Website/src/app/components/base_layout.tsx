import "./globals.css";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import React from "react";

/**
 * The general layout for this site to be used both for pages
 * using the app-router and the legacy pages-router.
 *
 * This will ensure that each page has a header and a footer.
 *
 * Because this is a flex-layout, children can use the `grow`
 * class to grow to take up the remaining space on the page.
 *
 * @param children The actual page this layout should wrap. In JSX, these are the
 *                 children of this element.
 * @param username The username of the currently logged-in user, or undefined if the user is not logged in.
 * @constructor
 */
export default function BaseLayout({ children }: { children: React.ReactNode }) {
	return (
		// inline styling using tailwind will keep styling information in the same
		// file as the markup information.
		<div className="h-full min-h-screen flex flex-initial flex-col">
			<Header />
			{children}
			<Footer />
		</div>
	);
}
