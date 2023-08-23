import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/utils/helpers";

/**
 * Generic handler for creation requests
 * @param request       The request object
 * @param createFunc    The function used to send a creation request
 * @param validatorFunc A function that can be used to validate that the payload is actually what it claims to be.
 */
export async function createHandler<T>(
	request: NextRequest,
	createFunc: (token: string, payload: T) => Promise<Response>,
	validatorFunc?: (payload: T) => payload is T
): Promise<NextResponse> {
	// obtain the auth token from the request cookies ...
	const token = request.cookies.get("token")?.value;
	// and the payload from the request body. Errors in json decoding will cause this to return undefined.
	const payload: T | undefined = await request.json().catch(() => undefined);

	// check for the presence of an auth token ...
	if (token == undefined) {
		return apiError(401);
	}
	// and for the presence of plausible update data ...
	if (payload == undefined || (validatorFunc && !validatorFunc(payload))) {
		return apiError(400);
	}

	try {
		// then send the update data to the backend
		const res = await createFunc(token, payload);

		// and send the respective response.
		if (res.ok) {
			// I'm not entirely certain what the backend responds with, so a 2XX response is
			// treated as a success, and the actual response, and status code are proxied.
			return new NextResponse(res.body, { status: res.status, statusText: res.statusText });
		} else {
			let apiRes: NextResponse;
			switch (res.status) {
				case 401:
					// The user is unauthenticated, so we better delete the auth token cookie.
					apiRes = apiError(401);
					apiRes.cookies.set({
						name: "token",
						value: "",
						sameSite: "lax",
						httpOnly: true,
						expires: new Date(0)
					});
					break;
				case 404:
					apiRes = apiError(404);
					break;
				default:
					apiRes = apiError(500);
					break;
			}
			return apiRes;
		}
	} catch (e) {
		console.error("Cannot post creation", payload, "- Reason: ", e);
		return apiError(500);
	}
}
