import { Dispatch, FormEventHandler, PropsWithChildren, useEffect, useRef, useState } from "react";

import Footer from "@/app/components/layout/footer";
import useSWR from "swr";
import { getCookie, setCookie } from "cookies-next";
import { inter } from "@/utils/common";
import { getFetcher } from "@/utils/fetcher";
import { useRouter } from "next/navigation";
import { Spinner } from "@/app/components/spinner";

/**
 * The track selection form for this web application.
 */
export default function Selection({
	completed,
	setCompleted
}: {
	completed: boolean;
	setCompleted: Dispatch<boolean>;
}) {
	// @type data TrackList
	const { data, error, isLoading } = useSWR("/webapi/tracks/list", getFetcher<"/webapi/tracks/list">);
	// get the next page router
	const router = useRouter();
	const selectedTrack = getCookie("track_id")?.toString();

	const selectTrack: FormEventHandler = e => {
		e.preventDefault();
		const data = new FormData(e.target as HTMLFormElement);

		// set the relevant cookie
		setCookie("track_id", data.get("track"));

		// change the React state
		setCompleted(true);

		// and reload
		router.refresh();
		return;
	};

	return (
		<form onSubmit={selectTrack} className="grid grid-cols-[1fr, 7fr] gap-y-1 my-1.5 items-center h-24">
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
					<div>Wird gespeichert...</div>
				</div>
			) : (
				<>
					<label className={""} htmlFor="track">
						Strecke:{" "}
					</label>
					<select
						defaultValue={selectedTrack}
						id={"track"}
						name={"track"}
						className="dark:bg-slate-700 rounded">
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
 * @param children 	HTML elements to display over the login form in the dialog, for example for explanations.
 * @param modal		Whether this is shown as part of a modal route.
 */
export function SelectionDialog({ children, modal = false }: PropsWithChildren<{ modal?: boolean }>) {
	const dialogRef = useRef(null as HTMLDialogElement | null);
	const router = useRouter();

	// get a "completed" state
	const [completed, setCompleted] = useState(false);

	useEffect(() => {
		if (!dialogRef.current?.open) {
			dialogRef.current?.showModal();
		}
	}, []);

	// if this is a modal, we need to move back to the previous page using the router
	useEffect(() => {
		if (completed && modal) {
			router.back();
		}
	}, [completed, modal, router]);

	return (
		<dialog
			ref={dialogRef}
			onCancel={event => {
				if (modal) {
					// if this is a modal, we need to move back to the previous page using the router
					router.back();
				}
				event.preventDefault();
			}}
			className="drop-shadow-xl shadow-black bg-white p-4 rounded max-w-2xl w-full dark:bg-slate-800 dark:text-white backdrop:bg-gray-200/30 backdrop:backdrop-blur">
			{children}
			<Selection completed={completed} setCompleted={setCompleted} />
			<Footer />
		</dialog>
	);
}
