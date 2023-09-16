"use client";

import Selection from "@/app/components/track_selection";
import { FormWrapper } from "@/app/components/form";
import { useState } from "react";
import Link from "next/link";

/**
 * The stand-alone track selection page
 */
export default function Page() {
	// obtain a "completed" state
	const [completed, setCompleted] = useState(false);

	return (
		<FormWrapper>
			{completed ? (
				<div className={"bg-green-300 border-green-600 text-black rounded p-2 text-center"}>
					<div>Änderungen gespeichert.</div>
					<Link className={"rounded-full bg-gray-700 px-10 text-white no-a-style"} href={"/map"}>
						Zur Karte
					</Link>
				</div>
			) : (
				<Selection completed={completed} setCompleted={setCompleted} />
			)}
		</FormWrapper>
	);
}
