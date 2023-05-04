import binascii


def decode(port: int, payload: str) -> dict:
    match port:
        case 30:
            return decode_uplink_port_30(payload)
        case 31:
            return decode_uplink_port_31(payload)
        case _:
            print("not implemented")


def decode_uplink_port_30(payload: str) -> dict:
    result_dict = dict()
    payload_bin = convert_to_bit_str(payload, 8)

    result_dict["firmware_major_version"] = get_value(payload_bin, 0, 0, 0, 7)
    result_dict["firmware_minor_version"] = get_value(payload_bin, 1, 0, 1, 7)
    result_dict["product_id"] = get_value(payload_bin, 2, 0, 2, 7)
    result_dict["hardware_revision"] = get_value(payload_bin, 3, 0, 3, 7)
    result_dict["power_on_reset"] = get_value(payload_bin, 4, 0, 4, 0)
    result_dict["watchdog_rest"] = get_value(payload_bin, 4, 1, 4, 1)
    result_dict["external_reset"] = get_value(payload_bin, 4, 2, 4, 2)
    result_dict["software_reset"] = get_value(payload_bin, 4, 3, 4, 3)
    result_dict["watchdog_reset_code"] = get_value(payload_bin, 5, 0, 6, 7)
    result_dict["battery_voltage_in_mV"] = 3500 + 32 * get_value(
        payload_bin, 7, 0, 7, 7
    )

    return result_dict


def decode_uplink_port_31(payload: str) -> dict:
    result_dict = dict()
    payload_bin = convert_to_bit_str(payload, 11)

    result_dict["average_gnss_time_to_first_fix"] = get_value(payload_bin, 0, 0, 0, 7)
    result_dict["average_wakeups_per_trip"] = get_value(payload_bin, 1, 0, 1, 7)
    result_dict["initial_battery_voltage_in_mV"] = 3500 + 32 * get_value(
        payload_bin, 2, 0, 2, 7
    )
    result_dict["current_battery_voltage_in_mV"] = 3500 + 32 * get_value(
        payload_bin, 3, 0, 3, 7
    )
    result_dict["is_battery_critical"] = get_value(payload_bin, 4, 0, 4, 0)
    result_dict["is_battery_low"] = get_value(payload_bin, 4, 1, 4, 1)
    result_dict["trip_count"] = get_value(payload_bin, 4, 2, 5, 7) * 32
    result_dict["uptime_in_weeks"] = get_value(payload_bin, 6, 0, 7, 1)
    result_dict["energy_used_in_mWh"] = get_value(payload_bin, 7, 2, 8, 3) * 10
    result_dict["percentage_used_on_LoRaWAN"] = (
        get_value(payload_bin, 8, 4, 9, 0) * 3.125
    )
    result_dict["percentage_used_on_successfull_gnss"] = (
        get_value(payload_bin, 9, 1, 9, 5) * 3.125
    )
    result_dict["percentage_used_on_unsuccessfull_gnss"] = (
        get_value(payload_bin, 9, 6, 10, 2) * 3.125
    )
    result_dict["percentage_used_on_sleeping_and_battery_self_discharge"] = (
        get_value(payload_bin, 10, 3, 10, 7) * 3.125
    )
    result_dict["percentage_of_energy_used_on_device_wakeups"] = (
        100
        - result_dict["percentage_used_on_LoRaWAN"]
        - result_dict["percentage_used_on_successfull_gnss"]
        - result_dict["percentage_used_on_unsuccessfull_gnss"]
        - result_dict["percentage_used_on_sleeping_and_battery_self_discharge"]
    )

    return result_dict


def get_value(
    payload: str,
    start_byte_index: int,
    start_bit_index: int,
    end_byte_index: int,
    end_bit_index: int,
) -> int:
    """
    Returns the integer value of the given interval.
    """
    length = len(payload)
    start = length - (end_byte_index * 8 + end_bit_index + 1)
    end = length - (start_byte_index * 8 + start_bit_index)
    return int(payload[start:end], base=2)


def convert_to_bit_str(payload: str, size: int) -> str:
    """Converts the given payload into the corresponding binary representations und adds leading zeros if needed.

    Parameters
    ----------
    payload : str
        The payload from the tracker
    size : int
        Size of payload in bytes
    """
    payload_byte = binascii.unhexlify(payload)
    return (
        bin(int.from_bytes(payload_byte, byteorder="little"))
        .lstrip("0b")
        .zfill(size * 8)
    )


# "Tests"
print(decode(30, "010A62010203017A"))
print(decode(31, "8BF3DC7B94389842780843"))
