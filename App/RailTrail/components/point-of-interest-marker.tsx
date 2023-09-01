import { View } from "react-native"
import { POIType } from "../types/init"
import LevelCrossing from "../assets/icons/level-crossing"
import LesserLevelCrossing from "../assets/icons/lesser-level-crossing"
import Picnic from "../assets/icons/picnic"
import TrackEnd from "../assets/icons/track-end"
import { memo } from "react"

interface ExternalProps {
  readonly pointOfInterestType: POIType
  readonly useSmallMarker?: boolean
}

type Props = ExternalProps

export const PointOfInterestMarker = memo(
  ({ pointOfInterestType, useSmallMarker }: Props) => {
    switch (pointOfInterestType) {
      case POIType.LevelCrossing:
        return (
          <LevelCrossing
            width={useSmallMarker ? 36 : 58}
            height={useSmallMarker ? 36 : 58}
          />
        )
      case POIType.LesserLevelCrossing:
        return (
          <LesserLevelCrossing
            width={useSmallMarker ? 32 : 46}
            height={useSmallMarker ? 28 : 40}
          />
        )
      case POIType.Picnic:
        return (
          <Picnic
            width={useSmallMarker ? 32 : 48}
            height={useSmallMarker ? 32 : 48}
          />
        )
      case POIType.TrackEnd:
        return (
          <TrackEnd
            width={useSmallMarker ? 32 : 48}
            height={useSmallMarker ? 32 : 48}
          />
        )
      default:
        return <View />
    }
  }
)
