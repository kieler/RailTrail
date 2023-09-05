from enum import IntEnum
from typing import Annotated, Literal
from annotated_types import Interval
from pydantic import BaseModel, Json, NonNegativeInt, StrictBool

class Position(BaseModel):
  lat: Annotated[float, Interval(ge=-90, le=90)]
  lng: Annotated[float, Interval(ge=-180, le=180)]

class PointOfInterest(BaseModel):
  id: NonNegativeInt
  typeId: NonNegativeInt
  trackId: NonNegativeInt
  name: str
  description: str | None = ""
  pos: Position
  trackId: NonNegativeInt
  isTurningPoint: StrictBool

class POITypeIcons(IntEnum):
  Generic = 0
  LevelCrossing = 1
  LesserLevelCrossing = 2
  Picnic = 3
  TrackEnd = 4
  TurningPoint = 5

class PointOfInterestType(BaseModel):
  id: NonNegativeInt
  name: str
  icon: POITypeIcons
  description: str | None = ""
  
class BackupFormat(BaseModel):
  types: list[PointOfInterestType]
  pois: list[PointOfInterest]