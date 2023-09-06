import argparse
import time
from urllib.parse import urljoin

from requests import put

from model import Response


def send_payload(backend_uri: str = 'http://localhost:8080', vehicle_id: int = 1, lat: float = 54.338253,
                 lng: float = 10.119030):
    url = urljoin(backend_uri, 'api/vehicles/app')
    request = {"vehicleId": int(vehicle_id), "pos": {"lat": float(lat), "lng": float(lng)}, "speed": int(20),
               "heading": int(10)}
    i = 0
    while True:
        i += 1
        print(f'Sending request number {i}')
        start = time.time()
        response = put(url, json=request)
        end = time.time()
        print(f'Request took {end - start} seconds')
        if not response.ok:
            print('Error sending request')
            break
        try:
            data = Response().model_validate_json(response.json())
            if data.pos is None:
                print('Response had no position')
        except ValueError:
            print('Validation failed')
        except:
            print('Error with response body')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Simulate high utilisation of app routes.')
    parser.add_argument('-b', '--backendURI', help='Backend URI e.g. https://railtrail.nicobiernat.de', type=str,
                        required=True)
    parser.add_argument('-i', '--vehicleID', help='Id for associated vehicle that will be simulated', type=int,
                        required=True)
    parser.add_argument('--lat', help='Latitude of simulated position by the app', type=float, required=True)
    parser.add_argument('--lng', help='Longitude of simulated position by the app', type=float, required=True)
    args = parser.parse_args()
    send_payload(backend_uri=args.backendURI, vehicle_id=args.vehicleID, lat=args.lat,
                 lng=args.lng)
