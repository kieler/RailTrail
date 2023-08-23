import { NextRequest } from "next/server";
import { deleteVehicle } from "@/utils/data";
import { deleteHandler } from "@/utils/webapi/handlers/deleteHandler";
import { defaultIdConverter } from "@/utils/webapi/handlers/defaultIdConverter";

/**
 * Handle the HTTP DELETE method for the route /webapi/vehicles/delete/[vehicleID]
 *
 * @param request        The request object. Not used
 * @param vehicleIDString The vehicleID part of the requested path. Automatically inserted by next.
 */
export async function DELETE(request: NextRequest, { params: { vehicleID } }: { params: { vehicleID: string } }) {
	return await deleteHandler(request, vehicleID, deleteVehicle, defaultIdConverter);
}
