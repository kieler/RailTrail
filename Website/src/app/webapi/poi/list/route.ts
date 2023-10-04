import { NextRequest } from "next/server";
import { getAllPOIs } from "@/utils/data";
import { getAllHandler } from "@/utils/webapi/handlers/getAllHandler";
import { PointOfInterest } from "@/utils/api";

/**
 * Handle HTTP GET requests
 */
export async function GET(request: NextRequest) {
	return await getAllHandler<PointOfInterest>(request, getAllPOIs);
}
