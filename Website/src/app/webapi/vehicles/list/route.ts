import { NextRequest } from "next/server";
import { getAllVehicles } from "@/utils/data";
import { getAllHandler } from "@/utils/webapi/handlers/getAllHandler";
import { Vehicle } from "@/utils/api";

/**
 * Returns a list of vehicles on a track as response to a GET request.
 *
 * @param request      An object representing the request that triggered this function.
 */
export async function GET(request: NextRequest) {
	return await getAllHandler<Vehicle>(request, getAllVehicles);
}
