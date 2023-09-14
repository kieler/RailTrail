/**
 * Offer an endpoint to call in order to request a track list. This will
 * read the auth token from the cookie, so we don't need to access it on the client
 */

import { getTrackList } from "@/utils/data";
import { NextRequest } from "next/server";
import { getAllHandler } from "@/utils/webapi/handlers/getAllHandler";
import { BareTrack } from "@/utils/api";

/**
 * Handle GET requests for this route
 */
export async function GET(request: NextRequest) {
	return await getAllHandler<BareTrack>(request, getTrackList);
}
