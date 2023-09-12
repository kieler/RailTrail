import Link from "next/link";

export default function Home() {
	return (
		<>
			<p>Dies sind die Verwaltungsfunktionen:</p>
			<ul className={"list-disc list-outside my-2 mx-8"}>
				<li>
					<Link href={"/management/add_track"}>Hinzufügen einer Strecke</Link>
				</li>
				<li>
					<Link href={"/management/myself"}>Ändern des eigenen Username oder Passwort</Link>
				</li>
				<li>
					<Link href={"/management/vehicles"}>Hinzufügen, Ändern, oder Löschen von Fahrzeugen</Link>
				</li>
				<li>
					<Link href={"/management/vehicleTypes"}>Hinzufügen, Ändern, oder Löschen von Fahrzeugenarten</Link>
				</li>
				<li>
					<Link href={"/management/poi"}>Hinzufügen, Ändern, oder Löschen von Interessenspunkten</Link>
				</li>
				<li>
					<Link href={"/management/poiTypes"}>
						Hinzufügen, Ändern, oder Löschen von Interessenspunktarten
					</Link>
				</li>
				<li>
					<Link href={"/management/trackers"}>Hinzufügen, Ändern, oder Löschen von Trackern</Link>
				</li>
				<li>
					<Link href={"/management/users"}>Hinzufügen oder Löschen von Nutzern</Link>
				</li>
			</ul>
		</>
	);
}
