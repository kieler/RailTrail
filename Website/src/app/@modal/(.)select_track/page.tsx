"use client";

import { SelectionDialog } from "@/app/components/track_selection";

/**
 * The stand-alone track selection page
 */
export default function SelectTrackModal() {
	// obtain a "completed" state
	// const [completed, setCompleted] = useState(false);

	return <SelectionDialog modal={true} />;
}
