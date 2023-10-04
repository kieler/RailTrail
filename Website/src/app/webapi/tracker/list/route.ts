import { NextRequest } from "next/server";
import { getAllTrackers } from "@/utils/data";
import { getAllHandler } from "@/utils/webapi/handlers/getAllHandler";
import { Tracker } from "@/utils/api";

/**
 * Handle HTTP GET requests to /webapi/vehicleTypes/list
 */
export async function GET(request: NextRequest) {
	return await getAllHandler<Tracker>(request, getAllTrackers);
}
