import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/utils/helpers";

/**
 * Generic handler for deletion requests
 * @param request           The request object
 * @param thingId           The id of the thing to be deleted
 * @param deleteFkt         The function to call to send the deletion request
 * @param thingIdConverter  A conversion function from a string to the id type. MUST return `undefined` if the id is invalid.
 */
export async function deleteHandler<T = number>(
	request: NextRequest,
	thingId: string,
	deleteFkt: (token: string, thingId: T) => Promise<Response>,
	thingIdConverter: (id: string) => T | undefined
) {
	// Convert the id
	const realId = thingIdConverter(thingId);

	// and check if it was valid.
	if (!realId) {
		console.log("Can not delete thing: ", thingId, "is invalid");
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
		const res = await deleteFkt(token, realId);

		// and process the response we get.
		if (res.ok) {
			return NextResponse.json("OK");
		} else {
			return apiError(res.status);
		}
	} catch (e) {
		// If we throw an error, log it and declare a server error.
		console.error("Cannot delete thing", thingId, "- Reason: ", e);
		return apiError(500);
	}
}
