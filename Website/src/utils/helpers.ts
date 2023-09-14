import * as http from "http";
import { decodeJwt, JWTPayload } from "jose";
import { NextResponse } from "next/server";
import { isTokenPayload } from "@/utils/api";

export const batteryLevelFormatter = new Intl.NumberFormat("de-DE", {
	notation: "standard",
	style: "percent",
	unit: "percent",
	maximumFractionDigits: 1
});

export const coordinateFormatter = new Intl.NumberFormat("de-DE", {
	notation: "standard",
	style: "unit",
	unit: "degree",
	maximumFractionDigits: 4
});

export const speedFormatter = new Intl.NumberFormat("de-DE", {
	notation: "standard",
	style: "unit",
	unit: "kilometer-per-hour",
	maximumFractionDigits: 1
});

/**
 * Transforms NaN to undefined
 */
export function nanToUndefined(x: number): number | undefined {
	if (Number.isNaN(x)) return;
	return x;
}

/**
 * Will try to call the supplied function, and will return undefined if an exception occurred.
 */
export function inlineTry<T>(f: () => T): T | undefined {
	try {
		return f();
	} catch (e) {
		return;
	}
}

/**
 * Create a response with a given HTTP status code
 */
export function apiError(statusCode: number): NextResponse<Error> {
	const statusText = http.STATUS_CODES[statusCode];

	return new NextResponse(statusText + "\r\n", {
		status: statusCode,
		statusText,
		headers: { "Content-Type": "text/plain" }
	});
}

/**
 * Extracts the username from the authentication json web token, as used by the database.
 * @param token the authentication jwt.
 */
export function getUsername(token: string): string {
	const payload: JWTPayload = decodeJwt(token);
	if (!isTokenPayload(payload)) {
		throw new TypeError("Not a valid jwt auth token");
	}
	return payload.username;
}
