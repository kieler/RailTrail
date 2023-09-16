import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/utils/data";
import { apiError } from "@/utils/helpers";

/**
 * Handle submissions of the login form (in the `app/components/Login.tsx` component)
 * @param request The request sent. Username and password are expected as `application/json`
 *                with the fields:
 *                - `username`:           the entered username
 *                - `password`:           the entered password
 * @returns A response with status 200 on successful login, with status 401 on a login failed on the backend, and a 502 on failure to communicate with the backend.
 */
export async function POST(request: NextRequest) {
	const data = await request.json();

	const username = data.username;
	const password = data.password;
	if (!(username && password)) {
		return new NextResponse("Malformed Request", { status: 400 });
	}
	try {
		const token = await authenticate(username, password);
		if (token) {
			cookies().set({
				name: "token",
				value: token,
				sameSite: "lax",
				httpOnly: true
			});
			console.log("User:", username, "login successful.");
			return apiError(200);
		} else {
			console.log("User:", username, "login failed.");
			return apiError(401);
		}
	} catch (e) {
		console.error("User:", username, "server failure", e);
		return apiError(502);
	}
}
