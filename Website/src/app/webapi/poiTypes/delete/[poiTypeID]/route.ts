import { NextRequest } from "next/server";
import { deletePOIType } from "@/utils/data";
import { deleteHandler } from "@/utils/webapi/handlers/deleteHandler";
import { defaultIdConverter } from "@/utils/webapi/handlers/defaultIdConverter";

/**
 * Handling HTTP DELETE requests for vehicle types
 * @param _request An (unused) object representing the request that triggered this function
 * @param params The path parameters (the value inserted for [poiTypeID] in the path)
 */
export async function DELETE(request: NextRequest, { params: { poiTypeID } }: { params: { poiTypeID: string } }) {
	return await deleteHandler(request, poiTypeID, deletePOIType, defaultIdConverter);
}
