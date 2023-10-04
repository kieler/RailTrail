import { NextRequest } from "next/server";
import { deletePOI } from "@/utils/data";
import { deleteHandler } from "@/utils/webapi/handlers/deleteHandler";
import { defaultIdConverter } from "@/utils/webapi/handlers/defaultIdConverter";

/**
 * Handling HTTP DELETE requests for points of interest
 * @param request An (unused) object representing the request that triggered this function
 * @param poiID The path parameter (the value inserted for [poiID] in the path)
 */
export async function DELETE(request: NextRequest, { params: { poiID } }: { params: { poiID: string } }) {
	return await deleteHandler(request, poiID, deletePOI, defaultIdConverter);
}
