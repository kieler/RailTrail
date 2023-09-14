import { NextRequest } from "next/server";
import { deleteVehicleType } from "@/utils/data";
import { deleteHandler } from "@/utils/webapi/handlers/deleteHandler";
import { defaultIdConverter } from "@/utils/webapi/handlers/defaultIdConverter";

/**
 * Handling HTTP DELETE requests for vehicle types
 * @param request An (unused) object representing the request that triggered this function
 * @param vehicleTypeID The path parameter (the value inserted for [vehicleTypeID] in the path)
 */
export async function DELETE(
	request: NextRequest,
	{ params: { vehicleTypeID } }: { params: { vehicleTypeID: string } }
) {
	return await deleteHandler(request, vehicleTypeID, deleteVehicleType, defaultIdConverter);
}
