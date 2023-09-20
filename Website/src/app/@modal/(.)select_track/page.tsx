"use client";

import { SelectionDialog } from "@/app/components/track_selection";

/**
 * A modal track selection dialog that will be overlayed over the rest of the page
 */
export default function SelectTrackModal() {

	return <SelectionDialog modal={true} />;
}
