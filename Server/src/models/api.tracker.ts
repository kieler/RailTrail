import { z } from "zod"

export const EndDeviceIdsTracker = z.object({
	device_id: z.string()
})

export const DecodedPayloadTracker = z.object({
	batV: z.number(),
	fixFailed: z.boolean(),
	headingDeg: z.number(),
	inTrip: z.boolean(),
	latitudeDeg: z.number(),
	longitudeDeg: z.number(),
	speedKmph: z.number(),
	type: z.string()
})

export const UplinkMessageTracker = z.object({
	f_port: z.number(),
	decoded_payload: DecodedPayloadTracker
})

export const UplinkTracker = z.object({
	end_device_ids: EndDeviceIdsTracker,
	received_at: z.string(),
	uplink_message: UplinkMessageTracker
})
