"use client";

import { RevalidateError, UnauthorizedError } from "@/utils/types";
import { FullTrack, Vehicle } from "@/utils/api";
import useSWR from "swr";
import { coordinateFormatter } from "@/utils/helpers";
import Link from "next/link";
import TrackerCharge from "@/app/components/tracker";
import { FunctionComponent } from "react";
import { getFetcher } from "@/utils/fetcher";
import { useRouter } from "next/navigation";

/**
 * A component to focus a vehicle. A link to the map view with the respective search parameter
 * @param v		The vehicle to focus
 */
function FocusVehicleLink({ v }: { v: Vehicle }) {
	return <Link href={`/map?focus=${v.id}`}>Link</Link>;
}

/**
 * A table of vehicles
 * @param sorted_vehicles	A sorted list of the vehicles
 * @param FocusVehicle		Component to focus a specific vehicle
 * @param compact			Flag for "compact" mode (removes some columns)
 */
export function VehicleList({
	sorted_vehicles,
	FocusVehicle,
	compact = false
}: {
	sorted_vehicles: Vehicle[];
	FocusVehicle: FunctionComponent<{ v: Vehicle }>;
	compact?: boolean;
}) {
	return (
		<table className={"table-auto border-collapse w-full"}>
			<thead>
				<tr className={"my-2"}>
					<th className={"mx-2 border-b-black dark:border-b-white border-b px-2"}>Name</th>
					{!compact && (
						<th className={"mx-2 border-b-black dark:border-b-white hidden sm:table-cell border-b px-2"}>
							geog. Breite
						</th>
					)}
					{!compact && (
						<th className={"mx-2 border-b-black dark:border-b-white hidden sm:table-cell border-b px-2"}>
							geog. Länge
						</th>
					)}
					{!compact && (
						<th className={"mx-2 border-b-black dark:border-b-white hidden sm:table-cell border-b px-2"}>
							Richtung
						</th>
					)}
					<th className={"mx-2 border-b-black dark:border-b-white border-b px-2"}>Batterieladung</th>
					<th className={"mx-2 border-b-black dark:border-b-white border-b px-2"}>Auf Karte zeigen</th>
				</tr>
			</thead>
			<tbody>
				{sorted_vehicles?.map((v: Vehicle) => (
					<tr key={v.id} className={"my-2"}>
						<td className={"mx-2 px-2 text-center"}>{v.name}</td>
						{!compact && (
							<td className={"mx-2 px-2 hidden sm:table-cell text-center"}>
								{v.pos ? coordinateFormatter.format(v.pos.lat) : "unbekannt"} N
							</td>
						)}
						{!compact && (
							<td className={"mx-2 px-2 hidden sm:table-cell text-center"}>
								{v.pos ? coordinateFormatter.format(v.pos.lng) : "unbekannt"} E
							</td>
						)}
						{!compact && (
							<td className={"mx-2 px-2 hidden sm:table-cell text-center"}>
								{v.heading ? coordinateFormatter.format(v.heading) : "unbekannt"}
							</td>
						)}
						<td className={"px-2 text-center"}>
							<div className={"max-w-[16rem] mx-auto"}>
								{v.trackerIds.map(trackerId => (
									<TrackerCharge key={trackerId} trackerId={trackerId} />
								))}
							</div>
						</td>
						<td className={"px-2 text-center"}>
							<FocusVehicle v={v} />
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

/**
 * A dynamic list of vehicles with their current position.
 * @param server_vehicles A pre-fetched list of vehicles to be used until this data is fetched on the client side.
 * @param track_id        The id of the currently selected track.  # TODO: remove redundant variable -> already in track_data
 * @param logged_in       A boolean indicating if the user is logged in.
 * @param track_data      The information about the currently selected track.
 * @param FocusVehicle	  Component to focus the specific vehicle.
 */
export default function DynamicList({
	server_vehicles,
	track_id,
	logged_in,
	track_data,
	FocusVehicle = FocusVehicleLink
}: {
	server_vehicles: Vehicle[];
	track_id: number;
	logged_in: boolean;
	track_data?: FullTrack;
	FocusVehicle?: FunctionComponent<{ v: Vehicle }>;
}) {
	const { data: vehicles, error } = useSWR(
		logged_in && track_id ? `/webapi/vehicles/list/${track_id}` : null,
		getFetcher<`/webapi/vehicles/list/${number}`>,
		{
			refreshInterval: 1000,
			fallbackData: server_vehicles
		}
	);

	// sort the vehicles
	const sorted_vehicles = vehicles?.sort((a, b) => a.id - b.id);

	// obtain the NextJS router
	const router = useRouter()

	if (logged_in && error) {
		if (error instanceof UnauthorizedError || (error instanceof RevalidateError && error.statusCode === 401)) {
			console.log("Invalid token");
			router.refresh();
		}
		console.log("revalidate error", error);
	}

	return (
		<>
			<h2>
				Fahrzeuge der Strecke {track_data?.start} - {track_data?.end}
			</h2>
			<VehicleList sorted_vehicles={sorted_vehicles} FocusVehicle={FocusVehicle} />
		</>
	);
}
