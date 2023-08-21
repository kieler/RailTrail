import { NextRequest } from "next/server";
import { getAllVehicleTypes } from "@/utils/data";
import { getAllHandler } from "@/utils/webapi/handlers/getAllHandler";
import { VehicleType } from "@/utils/api";

/**
 * Handle HTTP GET requests to /webapi/vehicleTypes/list
 */
export async function GET(request: NextRequest) {
	return await getAllHandler<VehicleType>(request, getAllVehicleTypes);
}
