import { NextRequest, NextResponse } from "next/server";
import { updateHandler } from "@/utils/webapi/handlers/updateHandler";
import { changePassword } from "@/utils/data";
import { PasswordChangeRequest } from "@/utils/api.website";

export async function PUT(request: NextRequest): Promise<NextResponse> {
	const changeResponse = await updateHandler<PasswordChangeRequest, true>(
		request,
		"",
		(token, _, payload) => changePassword(token, payload),
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
