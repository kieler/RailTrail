import { memo } from "react"
import { Geojson } from "react-native-maps"
import { Color } from "../values/color"

interface ExternalProps {
  readonly track: GeoJSON.FeatureCollection
}

type Props = ExternalProps

export const Track = memo(({ track }: Props) => {
  return <Geojson geojson={track} strokeColor={Color.track} strokeWidth={6} />
})
