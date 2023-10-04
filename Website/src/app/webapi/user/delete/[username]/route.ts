import { NextRequest } from "next/server";
import { deleteUser } from "@/utils/data";
import { deleteHandler } from "@/utils/webapi/handlers/deleteHandler";

/**
 * Handle the HTTP DELETE method for the route /webapi/user/delete/[username]
 *
 * @param request        The request object. Not used
 * @param vehicleIDString The vehicleID part of the requested path. Automatically inserted by next.
 */
export async function DELETE(request: NextRequest, { params: { username } }: { params: { username: string } }) {
	return await deleteHandler(request, username, deleteUser, id => id);
}
