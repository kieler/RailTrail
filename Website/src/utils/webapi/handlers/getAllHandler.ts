import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/utils/helpers";
import { UnauthorizedError } from "@/utils/types";

/**
 * Generic handler for list-all requests
 * @param request   The request object
 * @param getAllFkt The function used to request a list of all elements.
 */
export async function getAllHandler<T>(
	request: NextRequest,
	getAllFkt: (token: string) => Promise<T[]>
): Promise<NextResponse<T[] | Error>> {
	// obtain the authentication token from the request
	const token = request.cookies.get("token")?.value;

	// Check if the user is logged in. The real check for this is done by the backend.
	if (token == undefined) {
		return apiError(401);
	}

	try {
		// then request the list of vehicle types from the backend
		const data = await getAllFkt(token);
		// and return it to the client
		return NextResponse.json(data);
	} catch (e) {
		// Also handle errors. An UnauthorizedError is thrown when the backend responds with a 401,
		// i.e. the users token is invalid.
		if (e instanceof UnauthorizedError) {
			// delete the auth token.
			const apiRes = apiError(401);
			apiRes.cookies.set({
				name: "token",
				value: "",
				sameSite: "lax",
				httpOnly: true,
				expires: new Date(0)
			});
			return apiRes;
		} else {
			// Other errors are logged, and the user gets a 500 response
			console.error("Could not list things - Reason: ", e);
			return apiError(500);
		}
	}
}
