import { NextRequest } from "next/server";
import { createVehicleType } from "@/utils/data";
import { UpdateVehicleType } from "@/utils/api";
import { createHandler } from "@/utils/webapi/handlers/createHandler";

/**
 * Handles vehicle type data update requests from the client by proxying them to the backend.
 * No real error checking/input validation is done.
 *
 * @param request       An object representing the request that triggered this function.
 */
export async function POST(request: NextRequest) {
	return await createHandler<UpdateVehicleType>(request, createVehicleType);
}
