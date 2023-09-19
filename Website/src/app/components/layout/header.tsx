import Link from "next/link";
import { CurrentUser } from "@/app/components/layout/currentUser";
import SmartNavigation from "@/app/components/layout/smart_navigation";

/**
 * The header for the web page
 */
export default function Header() {
	return (
		<header
			className={
				"flex flex-row w-full items-center justify-around p-2 flex-wrap bg-white dark:bg-slate-900 gap-2"
			}>
			<div className={"mr-auto"}>
				<Link href={"/"}>RailTrail Verwaltung</Link>
			</div>
			<CurrentUser className={"ml-auto md:order-last"} />
			{/* Force a line break for small devices */}
			<div className={"w-full md:hidden"} />

			<SmartNavigation href={"/map"}>Karte</SmartNavigation>
			<SmartNavigation href={"/list"}>Liste</SmartNavigation>
			<SmartNavigation href={"/mapList"} className={"px-2 border-2 border-transparent hidden sm:block"}>
				Karte + Liste
			</SmartNavigation>

			<SmartNavigation href={"/management"}>Datenverwaltung</SmartNavigation>
		</header>
	);
}
