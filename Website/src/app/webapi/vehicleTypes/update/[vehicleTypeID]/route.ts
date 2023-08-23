import { NextRequest } from "next/server";
import { updateVehicleType } from "@/utils/data";
import { UpdateVehicleType } from "@/utils/api";
import { updateHandler } from "@/utils/webapi/handlers/updateHandler";
import { defaultIdConverter } from "@/utils/webapi/handlers/defaultIdConverter";

/**
 * Handles vehicle type data update requests from the client by proxying them to the backend.
 * No real error checking/input validation is done.
 *
 * @param request       An object representing the request that triggered this function.
 * @param params The path parameters (the value inserted for [vehicleTypeID] in the path)
 */
export async function PUT(request: NextRequest, { params: { vehicleTypeID } }: { params: { vehicleTypeID: string } }) {
	return await updateHandler<UpdateVehicleType>(request, vehicleTypeID, updateVehicleType, defaultIdConverter);
}
