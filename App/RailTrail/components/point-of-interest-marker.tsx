import { Platform, StyleSheet, View, Text, AppState } from "react-native"
import { textStyles } from "../values/text-styles"
import { Color } from "../values/color"
import { Marker } from "react-native-maps"
import Train from "../assets/icons/train"
import { POIType, PointOfInterest } from "../types/init"
import LevelCrossing from "../assets/icons/level-crossing"
import LesserLevelCrossing from "../assets/icons/lesser-level-crossing"
import Picnic from "../assets/icons/picnic"
import TrackEnd from "../assets/icons/track-end"

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
    case POIType.Picnic:
      return <Picnic />
    case POIType.TrackEnd:
      return <TrackEnd />
    default:
      return <View />
  }
}
