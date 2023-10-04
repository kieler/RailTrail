import * as React from "react"
import Svg, { SvgProps, Circle } from "react-native-svg"
const TrainBackgroundNeutral = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    viewBox="0 0 48 48"
    fill="none"
    {...props}
  >
    <Circle cx={24} cy={24} r={18} fill="#FAFAFA" />
  </Svg>
)
export default TrainBackgroundNeutral
