import { Spinner } from "@/app/components/spinner";

/**
 * A loading page to show while the Leaflet map is loaded dynamically.
 */
export default function LoadMapScreen() {
	return (
		<div className="flex gap-5 justify-center items-center content-center h-full">
			<Spinner className={"h-10 w-auto"} />
			<div>Loading...</div>
		</div>
	);
}
