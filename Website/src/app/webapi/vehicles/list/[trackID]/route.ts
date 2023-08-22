import { NextRequest } from "next/server";
import { apiError } from "@/utils/helpers";
import { getAllVehiclesOnTrack } from "@/utils/data";
import { getAllHandler } from "@/utils/webapi/handlers/getAllHandler";
import { Vehicle } from "@/utils/api";

/**
 * Returns a list of vehicles on a track as response to a GET request.
 *
 * @param request      An object representing the request that triggered this function. not used here.
 * @param trackIDString The [trackID] path of the requested route.
 */
export async function GET(
	request: NextRequest,
	{ params: { trackID: trackIDString } }: { params: { trackID: string } }
) {
	// convert the trackID into a number
	const trackID = +trackIDString;

	// check if the conversion was successful
	if (isNaN(trackID)) {
		// If not, it wasn't a number, so we return a "not found" response
		console.log("Can not list vehicles:", trackIDString, "is not a Number!");
		return apiError(404);
	}

	return await getAllHandler<Vehicle>(request, token => getAllVehiclesOnTrack(token, trackID));
}
