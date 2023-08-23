import { NextRequest } from "next/server";
import { updatePOI } from "@/utils/data";
import { defaultIdConverter } from "@/utils/webapi/handlers/defaultIdConverter";
import { UpdatePointOfInterest } from "@/utils/api";
import { updateHandler } from "@/utils/webapi/handlers/updateHandler";

/**
 * Handles vehicle type data update requests from the client by proxying them to the backend.
 * No real error checking/input validation is done.
 *
 * @param request       An object representing the request that triggered this function.
 * @param params The path parameters (the value inserted for [poiID] in the path)
 */
export async function PUT(request: NextRequest, { params: { poiID } }: { params: { poiID: string } }) {
	return await updateHandler<UpdatePointOfInterest>(request, poiID, updatePOI, defaultIdConverter);
}
