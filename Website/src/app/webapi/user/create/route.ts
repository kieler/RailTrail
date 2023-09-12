import { NextRequest } from "next/server";
import { createUser } from "@/utils/data";
import { createHandler } from "@/utils/webapi/handlers/createHandler";
import { AuthenticationRequest } from "@/utils/api.website";

/**
 * Handles vehicle data update requests from the client by proxying them to the backend.
 * No real error checking/input validation is done.
 *
 * @param request       An object representing the request that triggered this function.
 */
export async function POST(request: NextRequest) {
	return await createHandler<AuthenticationRequest>(request, createUser);
}
