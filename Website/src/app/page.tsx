import Link from "next/link";

export default function Home() {
	return (
		<main className="max-w-xl items-center mx-auto grow">
			<p>
				Diese Website bietet einige administrative Funktionen für generische Schienenfahrzeuge im RailTrail
				System:
			</p>
			<ul className={"list-disc list-outside my-2 ml-8"}>
				<li>
					Aktuelle Fahrzeugpositionen:
					<ul className={"list-disc list-outside ml-8"}>
						<li>
							<Link href={"/map"}>Auf einer Karte</Link>,
						</li>{" "}
						<li>
							<Link href={"/list"}>In einer Liste</Link> oder
						</li>
						<li>
							<Link href={"/mapList"}>Beides</Link>
						</li>
					</ul>
				</li>
				<li>
					Verwaltung der gespeicherten Daten <Link href={"/management"}>hier</Link>
				</li>
				<li>
					Auswahl einer anderen Strecke <Link href={"/select_track"}>hier</Link>
				</li>
				<li>
					Create a new user <Link href={"/signup"}>here</Link> (temporary)
				</li>
			</ul>
		</main>
	);
}
