"use client";

import { FormEventHandler, PropsWithChildren, useEffect, useRef, useState } from "react";

import Footer from "@/app/components/footer";
import useSWR from "swr";
import { setCookie } from "cookies-next";
import { inter } from "@/utils/common";
import { getFetcher } from "@/utils/fetcher";
import { useRouter } from "next/navigation";
import { Spinner } from "@/app/components/spinner";

/**
 * The track selection form for this web application.
 */
export default function Selection() {
	// @type data TrackList
	const { data, error, isLoading } = useSWR("/webapi/tracks/list", getFetcher<"/webapi/tracks/list">);
	// get the next page router
	const router = useRouter();
	// and a "completed" state
	const [completed, setCompleted] = useState(false);

	const selectTrack: FormEventHandler = e => {
		e.preventDefault();
		const data = new FormData(e.target as HTMLFormElement);

		// set the relevant cookie
		setCookie("track_id", data.get("track"));

		// change the react state
		setCompleted(true);

		// and reload
		router.refresh();
		return;
	};

	return (
		<form onSubmit={selectTrack} className="grid grid-cols-2 gap-y-1 my-1.5 items-center h-24">
			{isLoading ? (
				<div className={"flex col-span-2 justify-center items-center gap-5"}>
					<Spinner className={"h-10 w-auto"} />
					<div>Lädt...</div>
				</div>
			) : error ? (
				<div> {error.toString()} </div>
			) : completed ? (
				<div className={"flex col-span-2 justify-center items-center gap-5"}>
					<Spinner className={"h-10 w-auto"} />
					<div>Wird gepeichert...</div>
				</div>
			) : (
				<>
					<label className={""} htmlFor="track">
						Strecke:{" "}
					</label>
					<select id={"track"} name={"track"} className="dark:bg-slate-700 rounded">
						{data?.map(({ id, start, end }) => (
							<option
								value={id}
								key={id}
								className={`dark:bg-slate-700 dark:text-white ${inter.className}`}>
								{start} - {end}
							</option>
						))}
					</select>
					<button type="submit" className="col-span-2 rounded-full bg-gray-700 text-white">
						Auswählen
					</button>
				</>
			)}
		</form>
	);
}

/**
 * The track selection form wrapped in a dialog, for easy display in a modal way.
 * @param children       HTML elements to display over the login form in the dialog, for example for explanations.
 */
export function SelectionDialog({ children }: PropsWithChildren) {
	const dialogRef = useRef(null as HTMLDialogElement | null);

	useEffect(() => {
		if (!dialogRef.current?.open) {
			dialogRef.current?.showModal();
		}
	}, []);

	return (
		<dialog
			ref={dialogRef}
			onCancel={event => {
				event.preventDefault();
			}}
			className="drop-shadow-xl shadow-black bg-white p-4 rounded max-w-2xl w-full dark:bg-slate-800 dark:text-white backdrop:bg-gray-200/30 backdrop:backdrop-blur">
			{children}
			<Selection />
			<Footer />
		</dialog>
	);
}
