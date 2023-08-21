import { NextRequest } from "next/server";
import { updateVehicle } from "@/utils/data";
import { UpdateVehicle } from "@/utils/api";
import { updateHandler } from "@/utils/webapi/handlers/updateHandler";
import { defaultIdConverter } from "@/utils/webapi/handlers/defaultIdConverter";

/**
 * Handles vehicle data update requests from the client by proxying them to the backend.
 * No real error checking/input validation is done.
 *
 * @param request       An object representing the request that triggered this function.
 * @param vehicleIDString The [vehicleID] path of the requested route.
 */
export async function PUT(
	request: NextRequest,
	{
		params: { vehicleID }
	}: {
		params: { vehicleID: string };
	}
) {
	return await updateHandler<UpdateVehicle>(request, vehicleID, updateVehicle, defaultIdConverter);
}
