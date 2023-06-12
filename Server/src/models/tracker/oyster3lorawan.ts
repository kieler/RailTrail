export interface Oyster3Lorawan {
    end_device_ids: EndDeviceIDS;
    correlation_ids: string[];
    received_at: Date;
    uplink_message: UplinkMessage;
}

export interface EndDeviceIDS {
    device_id: string;
    application_ids: ApplicationIDS;
    dev_eui: string;
    join_eui: string;
    dev_addr: string;
}

export interface ApplicationIDS {
    application_id: string;
}

export interface UplinkMessage {
    session_key_id: string;
    f_port: number;
    f_cnt: number;
    frm_payload: string;
    decoded_payload: string;
    rx_metadata: RxMetadatum[];
    settings: Settings;
    received_at: Date;
    consumed_airtime: string;
    locations: Locations;
    version_ids: VersionIDS;
    network_ids: NetworkIDS;
}

export interface Locations {
    "frm-payload": FrmPayload;
}

export interface FrmPayload {
    latitude: number;
    longitude: number;
    source: Source;
    altitude?: number;
}

export enum Source {
    SourceGps = "SOURCE_GPS",
    SourceRegistry = "SOURCE_REGISTRY",
}

export interface NetworkIDS {
    net_id: string;
    tenant_id: string;
    cluster_id: string;
    cluster_address: string;
}

export interface RxMetadatum {
    gateway_ids: GatewayIDS;
    time?: Date;
    timestamp: number;
    rssi: number;
    channel_rssi: number;
    snr?: number;
    frequency_offset?: string;
    location?: FrmPayload;
    uplink_token: string;
    channel_index?: number;
    received_at: Date;
    gps_time?: Date;
}

export interface GatewayIDS {
    gateway_id: string;
    eui: string;
}

export interface Settings {
    data_rate: DataRate;
    frequency: string;
    timestamp: number;
    time: Date;
}

export interface DataRate {
    lora: Lora;
}

export interface Lora {
    bandwidth: number;
    spreading_factor: number;
    coding_rate: string;
}

export interface VersionIDS {
    brand_id: string;
    model_id: string;
    hardware_version: string;
    firmware_version: string;
    band_id: string;
}