import Link from "next/link";

export default function Home() {
	return (
		<main className="max-w-xl items-center mx-auto grow">
			<p>This website offers some administrative thingies:</p>
			<ul className={"list-disc list-inside my-2"}>
				<li>
					Current vehicle positions: <Link href={"/map"}>here</Link> or <Link href={"/list"}>here</Link>
				</li>
				<li>
					Manage the database <Link href={"/management"}>here</Link>
				</li>
				<li>
					Select a different track <Link href={"/select_track"}>here</Link>
				</li>
				<li>
					Login <Link href={"/login"}>here</Link>
				</li>
				<li>
					Logout{" "}
					<Link href={"/logout"} prefetch={false}>
						here
					</Link>
				</li>
				<li>
					Create a new user <Link href={"/signup"}>here</Link> (temporary)
				</li>
			</ul>
		</main>
	);
}
