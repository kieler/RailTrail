import { FullTrack, PointOfInterest, TokenPayload } from "./api"
import { z } from "zod"

export const authenticationRequest = z.object({
	username: z.string(),
	password: z.string()
})

export const authenticationResponse = z.object({
	token: z.string()
})

export const passwordChangeRequest = z.object({
	oldPassword: z.string(),
	newPassword: z.string()
})

export const usernameChangeRequest = z.object({
	oldUsername: z.string(),
	newUsername: z.string()
})

export const user = z.object({
	username: z.string()
})

export const InitResponseWebsite = FullTrack

export const PointOfInterestWebsite = PointOfInterest

/**
 * Check if a given object is a JWR token payload
 * @param payload
 */
export function isTokenPayload(payload: z.infer<typeof TokenPayload> | any): payload is z.infer<typeof TokenPayload> {
	return typeof payload.username === "string" && (payload.iat === undefined || typeof payload.iat === "number")
}
