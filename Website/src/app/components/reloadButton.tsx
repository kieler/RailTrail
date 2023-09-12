"use client";
import { useRouter } from "next/navigation";
import { PropsWithChildren } from "react";

export function ReloadButton({ className, children }: PropsWithChildren<{ className?: string }>) {
	const router = useRouter();

	return (
		<button className={className} onClick={() => router.refresh()}>
			{children}
		</button>
	);
}
