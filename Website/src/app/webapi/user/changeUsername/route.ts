import { NextRequest, NextResponse } from "next/server";
import { updateHandler } from "@/utils/webapi/handlers/updateHandler";
import { changeUsername } from "@/utils/data";
import { UsernameChangeRequest } from "@/utils/api.website";

/**
 * Proxy username change requests to the backend.
 * @param request
 * @constructor
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
	const changeResponse = await updateHandler<UsernameChangeRequest, true>(
		request,
		"",
		(token, _, payload) => changeUsername(token, payload),
		_ => true
	);

	if (changeResponse.ok) {
		// If the response is ok, we need to remove the token cookie, as that should now be invalid
		changeResponse.cookies.delete({
			name: "token",
			sameSite: "lax",
			httpOnly: true
		});
	}
	return changeResponse;
}
