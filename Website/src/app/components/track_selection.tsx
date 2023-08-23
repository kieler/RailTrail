"use client";

import { FormEventHandler, useEffect, useRef } from "react";

import Footer from "@/app/components/footer";
import { RevalidateError } from "@/utils/types";
import useSWR from "swr";
import { setCookie } from "cookies-next";
import { inter } from "@/utils/common";
import { TrackList } from "@/utils/api";

const selectTrack: FormEventHandler = e => {
	e.preventDefault();
	const data = new FormData(e.target as HTMLFormElement);

	// set the relevant cookie
	setCookie("track_id", data.get("track"));

	console.log(data);
	// and reload
	window.location.reload();
	return;
};

const fetcher = async (url: string) => {
	const res = await fetch(url);
	if (!res.ok) {
		// console.log('not ok!');
		throw new RevalidateError("Re-Fetching unsuccessful", res.status);
	}
	return (await res.json()) as TrackList;
};

/**
 * The track selection form for this web application.
 */
export default function Selection() {
	// @type data TrackList
	const { data, error, isLoading } = useSWR("/webapi/tracks/list", fetcher);

	return (
		<form onSubmit={selectTrack} className="grid grid-cols-2 gap-y-1 my-1.5 items-center">
			{isLoading ? (
				<p> Lädt... </p>
			) : error ? (
				<p> {error.toString()} </p>
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
export function SelectionDialog({ children }: React.PropsWithChildren) {
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
