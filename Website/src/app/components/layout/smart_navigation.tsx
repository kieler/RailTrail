"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren } from "react";

/**
 * A navigation link that has a different style when the user is on the page it links to, or on a sub-page
 * @param href				The URL to navigate to
 * @param className			CSS classes for the enclosing div
 * @param activeClassName	Additional CSS classes for the enclosing div, when active
 * @param linkClassName		The CSS classes for the anchor tag
 * @param children			The contents in the anchor tag
 * @param props				Other options applicable to <Link>
 * @constructor
 */
export default function SmartNavigation({
	href,
	className = "px-2 border-2 border-transparent",
	linkClassName,
	children,
	...props
}: PropsWithChildren<LinkProps & { href: string; className?: string; linkClassName?: string }>) {
	// get the path of the currently open page
	const currentPath = usePathname();

	// and determine if we are currently on that path
	const active = (currentPath === href || currentPath?.startsWith(href + "/")) ?? false;

	const activeClassName = "bg-neutral-500/20 !border-gray-500 rounded";

	return (
		<div className={className + (active ? " " + activeClassName : "")}>
			<Link href={href} className={linkClassName} {...props}>
				{children}
			</Link>
		</div>
	);
}
