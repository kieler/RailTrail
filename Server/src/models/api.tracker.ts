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

export const LteRecord = z.object({
	SeqNo: z.number(),
	Reason: z.number(),
	DateUTC: z.string(),
	Fields: z.any() // list of heterogenous objects depending on FType
})

export const LteRecordField0 = z.object({
	GpsUTC: z.string(),
	Lat: z.number(),
	Long: z.number(),
	Alt: z.number(),
	Spd: z.number(),
	SpdAcc: z.number(),
	Head: z.number(),
	PDOP: z.number(),
	PosAcc: z.number(),
	GpsStat: z.number(),
	FType: z.literal(0)
})

export const LteRecordField6 = z.object({
	AnalogueData: z.any(), // object with numbers as keys ("1": probably battery voltage (x100), "3": probably temperature (x100), "4": probably GSM signal)
	FType: z.literal(6)
})

export const UplinkLteTracker = z.object({
	SerNo: z.number(),
	IMEI: z.string(),
	ICCID: z.string(),
	ProdId: z.number(),
	FW: z.string(),
	Records: z.array(LteRecord)
})
