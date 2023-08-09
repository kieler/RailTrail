export interface UplinkTracker {
    end_device_ids: EndDeviceIdsTracker,
    received_at: string,
    uplink_message: UplinkMessageTracker,
}

export interface EndDeviceIdsTracker {
    device_id: string,
}

export interface UplinkMessageTracker {
    f_port: number,
    decoded_payload: DecodedPayloadTracker,
}

export interface DecodedPayloadTracker {
    batV: number,
    fixFailed: boolean,
    headingDeg: number,
    inTrip: boolean,
    latitudeDeg: number,
    longitudeDeg: number,
    speedKmph: number,
    type: string,
}