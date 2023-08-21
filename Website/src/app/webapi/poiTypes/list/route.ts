import { NextRequest } from "next/server";
import { getAllPOITypes } from "@/utils/data";
import { getAllHandler } from "@/utils/webapi/handlers/getAllHandler";
import { POIType } from "@/utils/api";

/**
 * Handle HTTP GET requests to /webapi/vehicleTypes/list
 */
export async function GET(request: NextRequest) {
	return await getAllHandler<POIType>(request, getAllPOITypes);
}
