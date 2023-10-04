import { NextRequest, NextResponse } from "next/server";
import { createTrack } from "@/utils/data";
import { createHandler } from "@/utils/webapi/handlers/createHandler";
import { UpdateTrack } from "@/utils/api";

/**
 * Handle POST requests for this route
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
	return await createHandler<UpdateTrack>(request, createTrack);
}
