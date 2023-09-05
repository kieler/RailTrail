import typer
import json
from typing_extensions import Annotated
from typing import  Optional
from requests import get, post
from urllib.parse import urljoin
from sys import stdin
from rich import print, print_json
from io import StringIO

from model import BackupFormat

app = typer.Typer(add_completion=False, no_args_is_help=True)


def authenticate(backend_URI: str, username: str, password: str) -> str:
    """
    Obtains a authentication token from the backend with the supplied credentials

    :param backend_URI: The base path from which the backend is accessible, without the `api` part.
    :param username: The username of the user that tries authenticating
    :param password: The password of the user that tries authenticating
    :returns: The login token of the authenticated user
    :raises AttributeError: raises AttributeError if authentication fails
    """
    auth_request = {"username": username, "password": password}
    auth_url = urljoin(backend_URI, 'api/login')
    response = post(auth_url, json=auth_request)
    if not response.ok:
        raise AttributeError(f"Authentication failed. Backend responded with {response.status_code}: {response.reason}")
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
    """
    Code to run with `main.py backup`
    """
    # Choose the IO object to write the JSON to. If no output file is specified,
    # use a StringIO object to catch the JSON for rich printing to the 
    target_file = open(file, 'x') if file else StringIO()
    with target_file:

        # Authenticate the user with the backend
        token = authenticate(backend_URI, username, password)

        # Construct the URLs for the POI and POIType route
        poi_url = urljoin(backend_URI, 'api/poi')
        poitype_url = urljoin(backend_URI, 'api/poiType')

        # Construct the value for the the `Authorization`-Header
        auth_header = f"Bearer {token}"

        # request the POIs
        poi_response = get(poi_url, headers={'Authorization': auth_header})
        if not poi_response.ok:
            raise AttributeError(f"Fetching POIs failed. Backend responded with {poi_response.status_code}: {poi_response.reason}")
        poi_data = poi_response.json()

        # then request the POI Types
        poi_type_response = get(poitype_url, headers={'Authorization': auth_header})
        if not poi_response.ok:
            raise AttributeError(f"Fetching POIs failed. Backend responded with {poi_response.status_code}: {poi_response.reason}")
        poi_type_data = poi_type_response.json()

        # combine both of these into a single dict
        data = BackupFormat(types=poi_type_data, pois=poi_data)
        
        # and dump them to the target file
        target_file.write(data.model_dump_json(indent=indent))
        if not file:
            assert isinstance(target_file, StringIO)
            # the target file is stringIO, and we can pretty-print the json with rich    
            print_json(target_file.getvalue())


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
    source_file = open(file, 'r') if file else stdin
    with source_file:
        data = BackupFormat.model_validate_json(source_file.read())
        print(data)



if __name__ == '__main__':
    app()
