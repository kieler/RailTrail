const Page = () => (
	<main className="max-w-xl items-center mx-auto grow">
		<p>Der Schutz Ihrer Daten ist uns sehr wichtig. Wir erheben möglicherweise folgende Daten über Sie: </p>
		<ul className={"list-disc list-outside my-2 mr-8"}>
			<li>IP-Adresse</li>
			<li>Verwendeter Webbrowser</li>
			<li>Standort</li>
			<li>Nutzername</li>
			<li>Gewählte Strecke</li>
		</ul>
		<p>Dazu setzen wir Cookies ein.</p>
		<p>
			Bei Nutzung der Seite werden außerdem Kartendaten von{" "}
			<a href={"https://www.openstreetmap.org"}>www.openstreetmap.org</a> abgerufen um die Karte darzustellen.
			Hierbei wird zwingend Ihre IP-Adresse an diesen Drittanbieter übertragen.
		</p>
		<p>TODO: Add some more legal text here</p>
	</main>
);

export default Page;
