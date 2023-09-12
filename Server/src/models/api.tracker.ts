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

export type UplinkLteTracker = {
	SerNo: number
	IMEI: string
	ICCID: string
	ProdId: number
	FW: string
	Records: LteRecord[]
}

export type LteRecord = {
	SeqNo: number
	Reason: number
	DateUTC: string
	Fields: any // list of heterogenous objects depending on FType
}

export type LteRecordField0 = {
	GpsUTC: string
	Lat: number
	Long: number
	Alt: number
	Spd: number
	SpdAcc: number
	Head: number
	PDOP: number
	PosAcc: number
	GpsStat: number
	FType: 0
}

export type LteRecordField6 = {
	AnalogueData: any // object with numbers as keys ("1": probably battery voltage (x100), "3": probably temperature (x100), "4": probably GSM signal)
	FType: 6
}
