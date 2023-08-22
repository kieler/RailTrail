/**
 * Offer an endpoint to call in order to request new vehicle positions. This will
 * read the auth token from the cookie, so we don't need to access it on the client
 */

import { getAllVehiclesOnTrack } from "@/utils/data";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError } from "@/utils/types";
import { apiError } from "@/utils/helpers";

export async function POST(request: NextRequest) {
	// TODO: remove entirely
	return apiError(405);

	// console.log("foobar", request)
	const token = cookies().get("token")?.value;
	const track_id: number = (await request.json()).track_id;
	// console.log("requested track_id", track_id);

	if (token) {
		try {
			const vehicles = await getAllVehiclesOnTrack(token!, track_id);
			// console.log("vehicles", vehicles)
			return NextResponse.json(vehicles);
		} catch (e: unknown) {
			if (e instanceof UnauthorizedError) {
				// token may have expired. Delete token.
				cookies().set({
					name: "token",
					value: "",
					sameSite: "lax",
					httpOnly: true,
					expires: new Date(0)
				});
				console.log("UnauthorizedError");
				return new NextResponse("Unauthorized", { status: 401 });
			} else return new NextResponse("Error" + e, { status: 500 });
		}
	} else {
		return new NextResponse("Unauthorized", { status: 401 });
	}
}
