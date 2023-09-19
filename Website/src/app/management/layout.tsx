import { FormWrapper } from "@/app/components/form";
import React from "react";
import SmartNavigation from "@/app/components/layout/smart_navigation";

/**
 * The
 * @param children
 * @constructor
 */
export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<header
				className={
					"flex flex-row w-full justify-items-center justify-around p-2 flex-wrap bg-gray-100 dark:bg-slate-800 gap-2"
				}>
				<SmartNavigation href={"/management/add_track"}>Strecke hinzufügen</SmartNavigation>
				<SmartNavigation href={"/management/vehicles"}>Fahrzeuge</SmartNavigation>
				<SmartNavigation href={"/management/trackers"}>Tracker</SmartNavigation>
				<SmartNavigation href={"/management/poi"}>Interessenspunkte</SmartNavigation>
				<SmartNavigation href={"/management/vehicleTypes"}>Fahrzeugarten</SmartNavigation>
				<SmartNavigation href={"/management/poiTypes"}>Interessenspunktarten</SmartNavigation>
				<SmartNavigation href={"/management/users"}>andere Nutzer</SmartNavigation>
				<SmartNavigation href={"/management/myself"}>eigener Nutzer</SmartNavigation>
			</header>
			<FormWrapper>{children}</FormWrapper>
		</>
	);
}
