import Link from "next/link";

/**
 * The footer for the web page
 */
export default function Footer() {
	return (
		<footer className={"flex place-content-between px-2"}>
			<div>
				RailTrail ist eine Entwicklung der{" "}
				<a href={"https://www.rtsys.informatik.uni-kiel.de/"}>
					Arbeitsgruppe Echtzeitsysteme / Eingebettete Systeme
				</a>{" "}
				der <a href={"https://www.uni-kiel.de/"}>Christian-Albrechts-Universität zu Kiel</a>.
			</div>
			<div>
				<Link href={"/data_protection"}>Datenschutzerklärung</Link>
			</div>
		</footer>
	);
}
