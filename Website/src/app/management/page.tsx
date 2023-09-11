import Link from "next/link";

export default function Home() {
	return (
		<>
			<p>Welcome to the management directory. You can</p>
			<ul className={"list-disc list-inside my-2"}>
				<li>
					Add a track <Link href={"/management/add_track"}>here</Link>
				</li>
				<li>
					Create, modify or delete vehicles <Link href={"/management/vehicles"}>here</Link>
				</li>
				<li>
					Create, modify or delete vehicle types <Link href={"/management/vehicleTypes"}>here</Link>
				</li>
				<li>
					Create, modify or delete points of interest <Link href={"/management/poi"}>here</Link>
				</li>
				<li>
					Create, modify or delete points of interest types <Link href={"/management/poiTypes"}>here</Link>
				</li>
				<li>
					Create, modify or delete trackers <Link href={"/management/trackers"}>here</Link>
				</li>
				<li>
					Create, modify or delete users <Link href={"/management/users"}>here</Link>
				</li>
				<li>
					Change your username or password <Link href={"/management/myself"}>here</Link>
				</li>
			</ul>
		</>
	);
}
