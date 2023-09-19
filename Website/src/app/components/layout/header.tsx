import Link from "next/link";
import { CurrentUser } from "@/app/components/layout/currentUser";

/**
 * The header for the web page
 */
export default function Header() {
	return (
		<header
			className={
				"flex flex-row w-full justify-items-center justify-around p-2 flex-wrap bg-white dark:bg-slate-800"
			}>
			<div className={"mr-auto"}>
				<Link href={"/"}>RailTrail Verwaltung</Link>
			</div>
			<CurrentUser className={"ml-auto sm:order-last"} />
			{/* Force a line break for small devices */}
			<div className={"w-full sm:hidden"} />

			<div>Foo</div>
			<div>Bar</div>
			<div>Baz</div>
		</header>
	);
}
