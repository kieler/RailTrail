import * as React from "react"
import Svg, { SvgProps, Circle } from "react-native-svg"
const UserLocation = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    fill="none"
    {...props}
  >
    <Circle cx={9} cy={9} r={8} fill="#4285f4" stroke="#fff" strokeWidth={2} />
  </Svg>
)
export default UserLocation
