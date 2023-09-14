"use client";
import { useRouter } from "next/navigation";
import { PropsWithChildren } from "react";

/**
 * A button that, when clicked, requests Next to re-render the page it is on.
 */
export function ReloadButton({ className, children }: PropsWithChildren<{ className?: string }>) {
	const router = useRouter();

	return (
		<button className={className} onClick={() => router.refresh()}>
			{children}
		</button>
	);
}
