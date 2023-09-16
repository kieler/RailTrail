import LoadMapScreen from "@/app/components/loadmap";

/**
 * A component that is shown while the actual page is generated.
 *
 * This is useful to mask the time to fetch data from the backend.
 */
export default function Loading() {
	return (
		<div className={"h-96 grow"}>
			<LoadMapScreen />
		</div>
	);
}
