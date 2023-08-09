import threading
import time
import math
import os
import gpxpy
import json
from datetime import datetime
import requests

def calculate_heading(point1, point2) -> float:
    lat1, lon1 = point1.latitude, point1.longitude
    lat2, lon2 = point2.latitude, point2.longitude

    # Convert coordinates to radians
    lat1, lon1 = math.radians(lat1), math.radians(lon1)
    lat2, lon2 = math.radians(lat2), math.radians(lon2)

    # Calculate the difference in longitudes
    delta_lon = lon2 - lon1

    # Calculate the heading
    y = math.sin(delta_lon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(delta_lon)
    heading = math.atan2(y, x)

    # Convert heading to degrees
    heading = math.degrees(heading)

    # Normalize heading to be between 0 and 360 degrees
    heading = (heading + 360) % 360

    return heading

def calculate_velocity_kmh(point1, point2):
    lat1, lon1, timestamp1 = point1.latitude, point1.longitude, point1.time
    lat2, lon2, timestamp2 = point2.latitude, point2.longitude, point2.time

    # Radius of the Earth in kilometers
    earth_radius = 6371

    # Convert coordinates to radians
    lat1, lon1 = math.radians(lat1), math.radians(lon1)
    lat2, lon2 = math.radians(lat2), math.radians(lon2)

    # Calculate time difference in seconds
    time_diff = (timestamp2 - timestamp1).total_seconds()

    # Calculate the Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = earth_radius * c

    # Adjust the distance based on time difference
    velocity = distance / time_diff

    return velocity * 3600

def encode_payload(lat: float, lon: float, heading: float, speed: int) -> bytes:
    buf = bytearray(b'')
    buf += int(lat * 10**7).to_bytes(4, 'little', signed=True)
    buf += int(lon * 10**7).to_bytes(4, 'little', signed=True)
    buf += (int(round(heading / 5.625) << 2 | 1)).to_bytes(1, 'little', signed=False) # 5.625 magic conversion number, logical or with 1 to indicate that we are in-trip
    buf += int(speed).to_bytes(1, 'little', signed=False)
    buf += int(4475 / 25).to_bytes(1, 'little', signed=False) # mV / 25 (magic conversion number)
    return bytes(buf)

def send_payload(vehicle_name: str, latitude: float, longitude: float, heading: float, speed: int):
    payload = {
        "end_device_ids": {
            "device_id": vehicle_name,
        },
        "received_at": datetime.utcnow().isoformat(),
        "uplink_message": {
            "f_port": 1,
            "decoded_payload": {
                "batV": 5,
                "fixFailed": False,
                "headingDeg": heading,
                "inTrip": True,
                "latitudeDeg": latitude,
                "longitudeDeg": longitude,
                "speedKmph": speed,
                "type": "position"
            }
        }
    }
    resp = requests.post(url=os.environ.get('BACKEND_URI'), json=payload)

def get_speedup_factor() -> float:
    speedup_factor = os.environ.get('SPEEDUP_FACTOR')
    if not speedup_factor:
        return 1.0
    
    speedup_factor = float(speedup_factor)
    if speedup_factor < 0:
        raise ValueError('speedup_factor must be > 0')
    return speedup_factor

def test_encode():
    payload = encode_payload(101.4541139, -189.6275708, 208.12, 10).hex()
    if payload != '53ab783c0421f98e950ab3':
        raise ValueError('Test encode failed')

def open_and_parse_gpx(filename):
    print('Opening file: {0}'.format(filename))
    gpx = None
    with open(filename) as gpx_file:
        gpx = gpxpy.parse(gpx_file)
    
    print("Num tracks: {0}".format(len(gpx.tracks)))
    print("Num waypoints: {0}".format(len(gpx.waypoints)))
    print("Num routes: {0}".format(len(gpx.routes)))

    points = []

    for i, track in enumerate(gpx.tracks):
        print('Track {0}, Num segments: {1}'.format(i, len(track.segments)))
        for i, segment in enumerate(track.segments):
            print('Segment {0}, Num points: {1}'.format(i, len(segment.points)))
            for i, point in enumerate(segment.points):
                points.append(point)

    print('Total duration of track {}'.format((points[-1].time - points[0].time) / get_speedup_factor()))

    return points

def simulate(points, vehicle_name):
    print('Starting vehicle-simulator "{}"'.format(vehicle_name))

    speedup_factor = get_speedup_factor()
    
    while True:
        for i, point in enumerate(points):
            heading = 0.0
            speed = 0
            if i > 0:
                diff_seconds = abs((point.time - points[i-1].time).total_seconds())
                time.sleep(diff_seconds / speedup_factor)
                print('{}: waiting {}s'.format(vehicle_name, diff_seconds))
                heading = calculate_heading(points[i-1], point)
                speed = abs(round(calculate_velocity_kmh(points[i-1], point))) * speedup_factor
                print('{}: lat: {}, lon: {}, heading: {}, speed: {}'.format(vehicle_name, point.latitude, point.longitude, heading, speed))
            send_payload(vehicle_name, point.latitude, point.longitude, heading, speed)
        points.reverse()

column_filenames = ["Daniel_1.gpx", "Daniel_2.gpx", "Jannis.gpx", "Julian.gpx", "Liam.gpx", "Nico.gpx", "Niklas.gpx"]

def main():
    speedup_factor = get_speedup_factor()
    print('Running with speedup factor of {0}'.format(speedup_factor))
    match os.environ.get('MODE'): # all modes reverse the vehicle at the end of the track
        case 'single': # one vehicle
            simulate(open_and_parse_gpx('route/route.gpx'), 'vehicle-simulator')
        case 'column': # multiple vehicles driving in the same direction after each other
            for filename in column_filenames:
                points = open_and_parse_gpx('route/{}'.format(filename))
                vehicle_name = 'vehicle-simulator-{}'.format(filename.split('.')[0])
                t = threading.Thread(target=simulate, args=(points, vehicle_name))
                t.start()
            t.join()
        case 'collision': # two vehicles starting at different points and driving towards each other (only on a subset of the track)
            points = open_and_parse_gpx('route/route.gpx')
            points = points[0:200]
            points_rev = points.copy()
            points_rev.reverse()
            t = threading.Thread(target=simulate, args=(points, 'vehicle-simulator-Daniel'))
            t.start()
            simulate(points_rev, 'vehicle-simulator-Niklas')
        case _: # same as single
            simulate(open_and_parse_gpx('route/route.gpx'), 'vehicle-simulator')

if __name__ == '__main__':
    main()