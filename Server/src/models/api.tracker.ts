/** @see {isUplinkTracker} ts-auto-guard:type-guard */
export type UplinkTracker = {
	end_device_ids: EndDeviceIdsTracker
	received_at: string
	uplink_message: UplinkMessageTracker
}

/** @see {isEndDevoceIdsTracker} ts-auto-guard:type-guard */
export type EndDeviceIdsTracker = {
	device_id: string
}

/** @see {isUplinkMessageTracker} ts-auto-guard:type-guard */
export type UplinkMessageTracker = {
	f_port: number
	decoded_payload: DecodedPayloadTracker
}

/** @see {isDecodedPayloadTracker} ts-auto-guard:type-guard */
export type DecodedPayloadTracker = {
	batV: number
	fixFailed: boolean
	headingDeg: number
	inTrip: boolean
	latitudeDeg: number
	longitudeDeg: number
	speedKmph: number
	type: string
}
