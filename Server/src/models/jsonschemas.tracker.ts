export const UplinkSchemaTracker = {
	id: "UplinkTracker",
	type: "object",
	properties: {
		end_device_ids: { $ref: "EndDeviceIdsTracker" },
		received_at: { type: "string" },
		uplink_message: { $ref: "UplinkMessageTracker" }
	},
	required: ["end_device_ids", "received_at", "uplink_message"],
	additionalProperties: true
}

export const EndDeviceIdsSchemaTracker = {
	id: "EndDeviceIdsTracker",
	type: "object",
	properties: {
		device_id: { type: "string" }
	},
	required: ["device_id"],
	additionalProperties: true
}

export const UplinkMessageSchemaTracker = {
	id: "UplinkMessageTracker",
	type: "object",
	properties: {
		f_port: { type: "number" },
		decoded_payload: { $ref: "DecodedPayloadTracker" }
	},
	required: ["f_port", "decoded_payload"],
	additionalProperties: true
}

export const DecodedPayloadSchemaTracker = {
	id: "DecodedPayloadTracker",
	type: "object",
	properties: {
		batV: { type: "number" },
		fixFailed: { type: "bool" },
		headingDeg: { type: "number" },
		inTrip: { type: "bool" },
		latitudeDeg: { type: "number" },
		longitudeDeg: { type: "number" },
		speedKmph: { type: "number" },
		type: { type: "string" }
	},
	required: ["batV", "fixFailed", "inTrip", "type"],
	additionalProperties: true
}
