def decode(port: int, payload: str) -> dict:
    byte_payload = convert_to_bytes(payload)
    match port:
        case 30:
            return decode_uplink_port_30(byte_payload)
        case _:
            print('not implemented')

def decode_uplink_port_30(payload: bytes) -> dict:
    result_dict = dict()
    print(payload)
    result_dict['firmware_major_version'] = int(payload[0:2], base=16)
    result_dict['firmware_minor_version'] = int(payload[2:4], base=16)
    result_dict['product_id'] = int(payload[4:6], base=16)
    result_dict['hardware_revision'] = int(payload[6:8], base=16)
    
    bit_string = convert_byte_to_bit_string(payload[8:10])
    result_dict['power_on_reset'] = bit_string[0]
    result_dict['watchdog_rest'] = bit_string[1]
    result_dict['external_reset'] = bit_string[2]
    result_dict['software_reset'] = bit_string[3]

    result_dict['watchdog_reset_code'] = int(payload[12:14] + payload[10:12], base=16)
    result_dict['battery_voltage_in_mV'] = 3500 + 32 * int(payload[14:16], base=16)

    return result_dict

def convert_to_bytes(byte_str: str) -> bytes:
    """
    Converts a byte sequence string to a byte sequence object.
    """
    return bytes(byte_str.encode('utf-8'))

def convert_byte_to_bit_string(byte: bytes, little_endian: bool = True) -> str:
    """
    Converts a byte into a binary representation.
    """
    bit_string = format(int(bin(int(byte, base=16)), base=2), '0>8b') 
    return bit_string[::-1] if little_endian else bit_string

# "Tests"
print(decode(30, "010A62010203017A"))