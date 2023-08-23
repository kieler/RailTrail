import { NextRequest } from "next/server";
import { updateTracker } from "@/utils/data";
import { Tracker } from "@/utils/api";
import { updateHandler } from "@/utils/webapi/handlers/updateHandler";

/**
 * Handles vehicle type data update requests from the client by proxying them to the backend.
 * No real error checking/input validation is done.
 *
 * @param request       An object representing the request that triggered this function.
 * @param params The path parameters (the value inserted for [trackerID] in the path)
 */
export async function PUT(request: NextRequest, { params: { trackerID } }: { params: { trackerID: string } }) {
	return await updateHandler<Tracker, string>(request, trackerID, updateTracker, id => id);
}
