// The function SWR uses to request a list of vehicles
import { RevalidateError, UnauthorizedError } from "@/utils/types";
import { BareTrack, PointOfInterest, POIType, Tracker, Vehicle, VehicleType } from "@/utils/api";
import { User } from "@/utils/api.website";

type TrackerId = string;
export type TrackerIdRoute = `/webapi/tracker/read/${TrackerId}`;

// Some useful type overloads
/**
 * This gives the expected datatype for each listing route in this thing.
 */
interface ApiRouteMap {
	"/webapi/poi/list": PointOfInterest[];
	"/webapi/poiTypes/list": POIType[];
	"/webapi/tracker/list": Tracker[];
	"/webapi/tracks/list": BareTrack[];
	"/webapi/vehicles/list": Vehicle[];
	[vehicleOnTrack: `/webapi/vehicles/list/${number}`]: Vehicle[];
	"/webapi/vehicleTypes/list": VehicleType[];
	"/webapi/user/list": User[];
	[trackerRead: TrackerIdRoute]: Tracker;
}
// export async function getFetcher(url: "/webapi/poi/list/"): Promise<PointOfInterest[]>;
// export async function getFetcher(url: "/webapi/poiTypes/list/"): Promise<POIType[]>;
// export async function getFetcher(url: "/webapi/tracker/list/"): Promise<Tracker[]>;
// export async function getFetcher(url: "/webapi/poi/list/"): Promise<PointOfInterest[]>;
// export async function getFetcher(url: "/webapi/vehicles/list/"): Promise<Vehicle[]>;
// export async function getFetcher(url: "/webapi/vehicleTypes/list/"): Promise<VehicleType[]>;
export type ApiRoute = keyof ApiRouteMap;

/** The function SWR uses to fetch things using a GET request. */
export async function getFetcher<K extends ApiRoute>(url: K): Promise<ApiRouteMap[K]> {
	const res = await fetch(url, { method: "GET", cache: "no-store" });
	if (!res.ok) {
		if (res.status === 401) throw new UnauthorizedError("Unauthorized");
		else throw new RevalidateError("Re-Fetching unsuccessful", res.status);
	}
	return await res.json();
}
