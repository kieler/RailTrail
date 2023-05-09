import binascii


def decode(port: int, payload: str) -> dict:
    match port:
        case 1:
            return decode_uplink_port_1(payload)
        case 2:
            return decode_uplink_port_2(payload)
        case 3:
            return decode_uplink_port_3(payload)
        case 4:
            return decode_uplink_port_4(payload)
        case 30:
            return decode_uplink_port_30(payload)
        case 31:
            return decode_uplink_port_31(payload)
        case _:
            print("not implemented")


def decode_uplink_port_1(payload: str) -> dict:
    result_dict = dict()
    payload_bin = convert_to_bit_str(payload, 10)

    result_dict["latitude"] = (
        signed_bin_to_dec(get_value(payload_bin, 0, 0, 3, 7, True)) / 10**7
    )
    result_dict["logitude"] = (get_value(payload_bin, 4, 0, 7, 7) - 2**32) / 10**7
    result_dict["is_on_trip"] = get_value(payload_bin, 8, 0, 8, 0)
    result_dict["last_fix_failed"] = get_value(payload_bin, 8, 1, 8, 1)
    result_dict["heading"] = get_value(payload_bin, 8, 2, 8, 7) * 5.625
    result_dict["speed_in_kmh"] = get_value(payload_bin, 9, 0, 9, 7)
    result_dict["battery_voltage_in_mV"] = get_value(payload_bin, 10, 0, 10, 7) * 25

    return result_dict


def decode_uplink_port_2(payload: str) -> dict:
    result_dict = dict()
    payload_bin = convert_to_bit_str(payload, 6)

    result_dict["sequence_number"] = get_value(payload_bin, 0, 0, 0, 6)
    result_dict["downlink_accepted"] = get_value(payload_bin, 0, 7, 0, 7)
    result_dict["firmware_major_version"] = get_value(payload_bin, 1, 0, 1, 7)
    result_dict["firmware_minor_version"] = get_value(payload_bin, 2, 0, 2, 7)
    result_dict["product_id"] = get_value(payload_bin, 3, 0, 3, 7)
    result_dict["hardware_revision"] = get_value(payload_bin, 4, 0, 4, 7)
    result_dict["acknowledged_downlink_port"] = get_value(payload_bin, 5, 0, 5, 7)

    return result_dict


def decode_uplink_port_3(payload: str) -> dict:
    result_dict = dict()
    payload_bin = convert_to_bit_str(payload, 11)

    result_dict["initial_battery_voltage_in_V"] = (
        get_value(payload_bin, 0, 0, 0, 3) * 0.1 + 4.0
    )
    result_dict["transmission_count"] = get_value(payload_bin, 0, 4, 1, 6) * 32
    result_dict["trip_count"] = get_value(payload_bin, 1, 7, 3, 3) * 32
    result_dict["gnss_success_count"] = get_value(payload_bin, 3, 4, 4, 5) * 32
    result_dict["gnss_failure_count"] = get_value(payload_bin, 4, 6, 5, 5) * 32
    result_dict["average_gnss_fix_time_in_s"] = get_value(payload_bin, 5, 6, 6, 6)
    result_dict["average_gnss_fail_time_in_s"] = get_value(payload_bin, 6, 7, 7, 7)
    result_dict["average_gnss_freshen_time_in_s"] = get_value(payload_bin, 8, 0, 8, 7)
    result_dict["wakeups_per_trip"] = get_value(payload_bin, 9, 0, 9, 6)
    result_dict["uptime_in_weeks"] = get_value(payload_bin, 9, 7, 10, 7)

    return result_dict


def decode_uplink_port_4(payload: str) -> dict:
    result_dict = dict()
    payload_bin = convert_to_bit_str(payload, 11)

    result_dict["latitude"] = (
        signed_bin_to_dec(get_value(payload_bin, 0, 0, 2, 7, True)) * 256 * 10**-7
    )
    result_dict["logitude"] = (get_value(payload_bin, 3, 0, 5, 7) - 2**24) * (
        256 * 10**-7
    )
    result_dict["heading"] = get_value(payload_bin, 6, 0, 6, 2) * 45
    result_dict["speed_in_kmh"] = get_value(payload_bin, 6, 3, 6, 7) * 5
    result_dict["battery_voltage_in_mV"] = get_battery_voltage(
        get_value(payload_bin, 7, 0, 7, 7), get_value(payload_bin, 8, 3, 8, 3)
    )
    result_dict["is_on_trip"] = get_value(payload_bin, 8, 0, 8, 0)
    result_dict["last_fix_failed"] = get_value(payload_bin, 8, 1, 8, 1)
    result_dict["inactivity_indicator_alarm"] = get_value(payload_bin, 8, 2, 8, 2)
    result_dict["battery_scale"] = get_value(payload_bin, 8, 3, 8, 3)
    result_dict["battery_critical"] = get_value(payload_bin, 8, 4, 8, 5)

    return result_dict


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
    binary_format: bool = False,
) -> int | str:
    """
    Returns the integer value of the given interval.
    """
    length = len(payload)
    start = length - (end_byte_index * 8 + end_bit_index + 1)
    end = length - (start_byte_index * 8 + start_bit_index)
    return payload[start:end] if binary_format else int(payload[start:end], base=2)


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


def signed_bin_to_dec(bin_str: str) -> int:
    """
    Converts a signed binary number (in the form of a string) to its decimal equivalent.
    """
    sign = -1 if bin_str[0] == "1" else 1
    num = int(bin_str, 2)
    if sign == -1:
        num = num - (1 << len(bin_str))
    return num


def get_battery_voltage(battery_value: int, battery_scale: int) -> int:
    """
    Calculates the battery volatage based on the current battery scale
    """
    if battery_scale:
        return battery_value * 32 + 3.5
    else:
        return battery_value * 25


# "Tests"
# print(decode(1, "53AB783C0421F98E940AB3"))
# print(decode(2, "D3010262010A"))
# print(decode(3, "8BF3DC7B9438984278B85E"))
# print(decode(4, "53AB783C04A1F98E06"))
# print(decode(30, "010A62010203017A"))
# print(decode(31, "8BF3DC7B94389842780843"))
