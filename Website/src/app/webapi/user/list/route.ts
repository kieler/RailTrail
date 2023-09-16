import { NextRequest } from "next/server";
import { getAllUsers } from "@/utils/data";
import { getAllHandler } from "@/utils/webapi/handlers/getAllHandler";
import { User } from "@/utils/api.website";

/**
 * Returns a list of vehicles on a track as response to a GET request.
 *
 * @param request      An object representing the request that triggered this function.
 */
export async function GET(request: NextRequest) {
	return await getAllHandler<User>(request, getAllUsers);
}
