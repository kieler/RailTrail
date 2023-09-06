from typing import Annotated

from annotated_types import Interval
from pydantic import BaseModel, NonNegativeInt, StrictBool, StrictInt, StrictFloat


class Position(BaseModel):
    lat: Annotated[float, Interval(ge=-90, le=90)]
    lng: Annotated[float, Interval(ge=-180, le=180)]


class VehicleApp(BaseModel):
    id: NonNegativeInt
    headingTowardsUser: StrictBool | None
    pos: Position | None
    percentagePosition: StrictFloat | None
    heading: StrictInt
    name: str
    track: StrictInt
    type: StrictInt
    trackerIds: list[str]


class Response(BaseModel):
    pos: Position
    heading: StrictInt
    vehiclesNearUser: list[VehicleApp]
    percentagePositionOnTrack: StrictFloat
    speed: StrictInt | StrictFloat
