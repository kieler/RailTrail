import { z } from "zod"

export const endDeviceIdsTracker = z.object({
	device_id: z.string()
})

export const decodedPayloadTracker = z.object({
	batV: z.number(),
	fixFailed: z.boolean(),
	headingDeg: z.number(),
	inTrip: z.boolean(),
	latitudeDeg: z.number(),
	longitudeDeg: z.number(),
	speedKmph: z.number(),
	type: z.string()
})

export const uplinkMessageTracker = z.object({
	f_port: z.number(),
	decoded_payload: decodedPayloadTracker
})

export const uplinkTracker = z.object({
	end_device_ids: endDeviceIdsTracker,
	received_at: z.string(),
	uplink_message: uplinkMessageTracker
})
