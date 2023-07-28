import * as http from "http";
import {NextResponse} from "next/server";

export const async_sleep: (time: number) => Promise<null> = (time) => new Promise((resolve, reject) => setTimeout(() => resolve(null), time))

export const batteryLevelFormatter = new Intl.NumberFormat('de-DE', {
    notation: "standard",
    style: 'unit',
    unit: 'percent',
    maximumFractionDigits: 1,
})

export const coordinateFormatter = new Intl.NumberFormat('de-DE', {
    notation: "standard",
    style: 'unit',
    unit: 'degree',
    maximumFractionDigits: 2,
})

export function nanToUndefined(x: number): number | undefined {
    if (Number.isNaN(x))
        return;
    return x;

}

export function apiError(statusCode: number) {
    const statusText = http.STATUS_CODES[statusCode];

    return new NextResponse(statusText + '\r\n', {status: statusCode, statusText, headers: {'Content-Type': 'text/plain'}})
}