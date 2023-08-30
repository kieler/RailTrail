import typer
import json
from typing_extensions import Annotated
from typing import Literal, Optional
from requests import get, post
from urllib.parse import urljoin
from sys import stderr, stdout
from rich import print, print_json
from io import StringIO

app = typer.Typer()

def authenticate(backend_URI: str, username: str, password: str) -> str:
    auth_request = {"username": username, "password": password}
    auth_url = urljoin(backend_URI, 'api/login')
    response = post(auth_url, json=auth_request)
    if not response.ok:
        raise AttributeError(f"Authentication failed. Backend responded with {response.status_code}: {response.reason}", file=stderr)
    return response.json()['token']


@app.command()
def backup(
    backend_URI: Annotated[str, typer.Option(
        prompt=True,
        default_factory=lambda: "https://railtrail.nicobiernat.de",
        show_default="https://railtrail.nicobiernat.de"
    )],
    username: Annotated[str, typer.Option(prompt=True)],
    password: Annotated[str, typer.Option(prompt=True, hide_input=True)],
    indent: Optional[int] = None,
    file: Annotated[Optional[str], typer.Argument(
        show_default="STDOUT")] = None
):
    target_file = open(file, 'x') if file else StringIO()
    token = authenticate(backend_URI, username, password)
    poi_url = urljoin(backend_URI, 'api/poi')
    poitype_url = urljoin(backend_URI, 'api/poiType')

    auth_header = f"Bearer {token}"

    poi_response = get(poi_url, headers={'Authorization': auth_header})
    if not poi_response.ok:
        raise AttributeError(f"Fetching POIs failed. Backend responded with {poi_response.status_code}: {poi_response.reason}")
    poi_data = poi_response.json()

    poi_type_response = get(poitype_url, headers={'Authorization': auth_header})
    if not poi_response.ok:
        raise AttributeError(f"Fetching POIs failed. Backend responded with {poi_response.status_code}: {poi_response.reason}")
    poi_type_data = poi_type_response.json()

    data = {
        "types": poi_type_data,
        "pois": poi_data
    }
    
    json.dump(data, target_file, indent=indent)
    if not file:
        # the target file is stringIO, and we can pretty-print the json with rich    
        print_json(target_file.getvalue())
    target_file.close()


@app.command()
def restore(
    backend_URI: Annotated[str, typer.Option(
        prompt=True,
        default_factory=lambda: "https://railtrail.nicobiernat.de",
        show_default="https://railtrail.nicobiernat.de"
    )],
    username: Annotated[str, typer.Option(prompt=True)],
    password: Annotated[str, typer.Option(prompt=True, hide_input=True)],
    file: Annotated[Optional[str], typer.Argument(
        show_default="STDIN")] = None
):
    print(backend_URI)
    pass


if __name__ == '__main__':
    app()
