import { apiError } from "@/utils/helpers";
import { NextRequest, NextResponse } from "next/server";
import { getTrackerById } from "@/utils/data";
import { UnauthorizedError } from "@/utils/types";

/**
 * Handle GET requests for a specific tracker
 * @param request       The request object that got us here
 * @param trackerID     The path component that is the tracker ID
 * @constructor
 */
export async function GET(request: NextRequest, { params: { trackerID } }: { params: { trackerID: string } }) {
	// check if the ID was valid.
	if (!trackerID) {
		console.log("Can not get tracker: ", trackerID, "is invalid");
		return apiError(404);
	}

	// obtain the authentication token from the request cookies
	const token = request.cookies.get("token")?.value;

	// If it is missing, the user is not logged in.
	if (token == undefined) {
		return apiError(401);
	}

	try {
		// initiate a deletion request on the backend
		const res = await getTrackerById(token, trackerID);

		return NextResponse.json(res);
	} catch (e) {
		if (e instanceof UnauthorizedError) {
			return apiError(401);
		}
		// If we throw an error, log it and declare a server error.
		console.error("Cannot get tracker", trackerID, "- Reason: ", e);
		return apiError(500);
	}
}
