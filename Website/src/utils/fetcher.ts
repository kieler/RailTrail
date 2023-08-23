// The function SWR uses to request a list of vehicles
import { RevalidateError } from "@/utils/types";
import { BareTrack, PointOfInterest, POIType, Tracker, Vehicle, VehicleType } from "@/utils/api";

// Some useful type overloads
/**
 * This gives the expected datatype for each listing route in this thing.
 */
interface ApiRouteMap {
	"/webapi/poi/list": PointOfInterest[];
	"/webapi/poiTypes/list": POIType[];
	"/webapi/tracker/list": Tracker[];
	"/webapi/track/list": BareTrack[];
	"/webapi/vehicles/list": Vehicle[];
	"/webapi/vehicleTypes/list": VehicleType[];
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
	const res = await fetch(url, { method: "GET" });
	if (!res.ok) {
		// console.log('not ok!');
		throw new RevalidateError("Re-Fetching unsuccessful", res.status);
	}
	return await res.json();
}
