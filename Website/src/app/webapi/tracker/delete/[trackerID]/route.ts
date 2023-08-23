import { NextRequest } from "next/server";
import { deleteTracker } from "@/utils/data";
import { deleteHandler } from "@/utils/webapi/handlers/deleteHandler";

/**
 * Handling HTTP DELETE requests for vehicle types
 * @param _request An (unused) object representing the request that triggered this function
 * @param params The path parameters (the value inserted for [trackerID] in the path)
 */
export async function DELETE(request: NextRequest, { params }: { params: { trackerID: string } }) {
	return await deleteHandler(request, params.trackerID, deleteTracker, id => id);
}
