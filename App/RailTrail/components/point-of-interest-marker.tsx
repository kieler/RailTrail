import { Platform, StyleSheet, View, Text, AppState } from "react-native"
import { textStyles } from "../values/text-styles"
import { Color } from "../values/color"
import { Marker } from "react-native-maps"
import Train from "../assets/icons/train"
import { POIType, PointOfInterest } from "../types/init"
import LevelCrossing from "../assets/icons/level-crossing"
import LesserLevelCrossing from "../assets/icons/lesser-level-crossing"
import Picknick from "../assets/icons/parking"

interface ExternalProps {
  readonly pointOfInterestType: POIType
}

type Props = ExternalProps

export const PointOfInterestMarker = ({ pointOfInterestType }: Props) => {
  switch (pointOfInterestType) {
    case POIType.LevelCrossing:
      return <LevelCrossing />
    case POIType.LesserLevelCrossing:
      return <LesserLevelCrossing />
    case POIType.Stops:
      return <Picknick />
    case POIType.TrackEnd:
      return <Picknick />
    default:
      return <View />
  }
}
