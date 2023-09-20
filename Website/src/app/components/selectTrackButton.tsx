import Link from "next/link";

/**
 * A link that somewhat resembles a button to select a different track.
 */
export function SelectTrackButton() {
	return (
		<Link
			href={"/select_track"}
			className={"bg-gray-200 dark:bg-slate-600 border-2 border-gray-500 rounded px-2 py-1 no-a-style"}>
			Andere Strecke wählen
		</Link>
	);
}
