from pydantic import NonNegativeInt
import typer
import json
from typing_extensions import Annotated
from typing import Mapping, MutableMapping, Optional
from requests import get, post, put
from urllib.parse import urljoin
from sys import stdin
from rich import print, print_json
from io import StringIO

from model import BackupFormat, PointOfInterest, PointOfInterestType

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
        raise AttributeError(
            f"Authentication failed. Backend responded with {response.status_code}: {response.reason}")
    return response.json()['token']

# Code to run with `main.py backup`


@app.command()
def backup(
    backend_URI: Annotated[str, typer.Option(
        prompt=True,
        default_factory=lambda: "https://railtrail.nicobiernat.de",
        show_default="https://railtrail.nicobiernat.de",
        help="The URL where RailTrail is running. Without the \"api/\" path component."
    )],
    username: Annotated[str, typer.Option(prompt=True)],
    password: Annotated[str, typer.Option(prompt=True, hide_input=True)],
    indent: Optional[int] = None,
    file: Annotated[Optional[str], typer.Argument(
        show_default="STDOUT")] = None
):
    """
    Create a backup of all POIs present in a given instance of RailTrail
    """
    # Choose the IO object to write the JSON to. If no output file is specified,
    # use a StringIO object to catch the JSON for rich printing to the
    target_file = open(file, 'x', encoding='utf8') if file else StringIO()
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
            raise AttributeError(
                f"Fetching POIs failed. Backend responded with {poi_response.status_code}: {poi_response.reason}")
        poi_data = poi_response.json()

        # then request the POI Types
        poi_type_response = get(poitype_url, headers={
                                'Authorization': auth_header})
        if not poi_response.ok:
            raise AttributeError(
                f"Fetching POIs failed. Backend responded with {poi_response.status_code}: {poi_response.reason}")
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
        show_default="https://railtrail.nicobiernat.de",
        help="The URL where RailTrail is running. Without the \"api/\" path component."
    )],
    username: Annotated[str, typer.Option(prompt=True)],
    password: Annotated[str, typer.Option(prompt=True, hide_input=True)],
    append: Annotated[bool, typer.Option(help="Whether to append the POI types and POIs from the backup to the existing ones or try to overwrite the existing ones.")] = False,
    file: Annotated[Optional[str], typer.Argument(
        show_default="STDIN")] = None
):
    source_file = open(file, 'r', encoding='utf8') if file else stdin
    with source_file:
        data = BackupFormat.model_validate_json(source_file.read())

        # Authenticate the user with the backend
        token = authenticate(backend_URI, username, password)

        # And construct the value for the the `Authorization`-Header
        auth_header = f"Bearer {token}"

        new_type_id_dict: dict[NonNegativeInt, NonNegativeInt] = {}

        # restore poi types
        for poi_type in data.types:
            restore_poi_type(backend_URI, append,
                             new_type_id_dict, poi_type, auth_header)

        # restore pois
        for poi in data.pois:
            restore_poi(backend_URI, append,
                        new_type_id_dict, poi, auth_header)


def overwritePoiType(
        backend_URI: str, poiType: PointOfInterestType, auth_header) -> bool:
    poiTypeReplaceUrl = urljoin(backend_URI, f"/api/poitype/{poiType.id}")

    poiTypeReplaceResponse = put(
        poiTypeReplaceUrl, json=poiType.model_dump(), headers={
            'Authorization': auth_header})

    if poiTypeReplaceResponse.ok:
        return True
    elif poiTypeReplaceResponse.status_code == 404:
        return False
    else:
        raise AttributeError(
            f"Replacing POIType {poiType.name}. Backend responded with {poiTypeReplaceResponse.status_code}: {poiTypeReplaceResponse.reason}")


def createPoiType(
        backend_URI: str, poiType: PointOfInterestType, auth_header) -> NonNegativeInt:
    poiTypeCreateUrl = urljoin(backend_URI, f"/api/poitype")

    poiTypeReplaceResponse = post(
        poiTypeCreateUrl, json=poiType.model_dump(), headers={
            'Authorization': auth_header})

    if poiTypeReplaceResponse.ok:
        responseType = PointOfInterestType.model_validate(
            poiTypeReplaceResponse.json())
        return responseType.id
    else:
        raise AttributeError(
            f"Creating POIType {poiType.name}. Backend responded with {poiTypeReplaceResponse.status_code}: {poiTypeReplaceResponse.reason}")


def restore_poi_type(
        backend_URI: str, append: bool,
        new_type_id_dict: MutableMapping[NonNegativeInt, NonNegativeInt],
        poi_type: PointOfInterestType, auth_header):
    if not append:
        # try to overwrite the poi type with the relevant id
        result = overwritePoiType(backend_URI, poi_type, auth_header)
        if result:
            # store the success in the relevant mapping and continue
            new_type_id_dict[poi_type.id] = poi_type.id
            return
    # else append the poi type
    new_id = createPoiType(backend_URI, poi_type, auth_header)
    # And store the result
    new_type_id_dict[poi_type.id] = new_id


def overwritePoi(backend_URI: str, poi: PointOfInterest, auth_header) -> bool:
    poiReplaceUrl = urljoin(backend_URI, f"/api/poi/{poi.id}")

    poiReplaceResponse = put(
        poiReplaceUrl, json=poi.model_dump(), headers={
            'Authorization': auth_header})

    if poiReplaceResponse.ok:
        return True
    elif poiReplaceResponse.status_code == 404:
        return False
    else:
        raise AttributeError(
            f"Replacing POIType {poi.name}. Backend responded with {poiReplaceResponse.status_code}: {poiReplaceResponse.reason}")


def createPoi(
        backend_URI: str, poi: PointOfInterest, auth_header) -> NonNegativeInt:
    poiCreateUrl = urljoin(backend_URI, f"/api/poi")

    poiCreateResponse = post(
        poiCreateUrl, json=poi.model_dump(), headers={
            'Authorization': auth_header})

    if poiCreateResponse.ok:
        return 0
    else:
        raise AttributeError(
            f"Creating POIType {poi.name}. Backend responded with {poiCreateResponse.status_code}: {poiCreateResponse.reason}")


def restore_poi(
        backend_URI, append,
        new_type_id_dict: Mapping[NonNegativeInt, NonNegativeInt],
        poi: PointOfInterest, auth_header):
    # adjust the type id which might be necessary, if we had to append the type
    adjusted_poi = poi.model_copy(
        update={"typeId": new_type_id_dict[poi.typeId]})

    if not append:
        # try to overwrite the poi with the relevant id
        result = overwritePoi(backend_URI, adjusted_poi, auth_header)
        if result:
            return
    # else append the poi
    new_id = createPoi(backend_URI, adjusted_poi, auth_header)


if __name__ == '__main__':
    app()
