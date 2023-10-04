import { FullTrack, PointOfInterest } from "./api"
import { z } from "zod"

export const AuthenticationRequest = z.object({
	username: z.string().nonempty(),
	password: z.string().nonempty()
})

export const AuthenticationResponse = z.object({
	token: z.string().nonempty()
})

export const PasswordChangeRequest = z.object({
	oldPassword: z.string().nonempty(),
	newPassword: z.string().nonempty()
})

export const UsernameChangeRequest = z.object({
	oldUsername: z.string().nonempty(),
	newUsername: z.string().nonempty()
})

export const User = z.object({
	username: z.string().nonempty()
})

export const InitResponseWebsite = FullTrack

export const PointOfInterestWebsite = PointOfInterest

// /**
//  * Check if a given object is a JWR token payload
//  * @param payload
//  */
// export function isTokenPayload(payload: z.infer<typeof TokenPayload> | any): payload is z.infer<typeof TokenPayload> {
// 	return typeof payload.username === "string" && (payload.iat === undefined || typeof payload.iat === "number")
// }
