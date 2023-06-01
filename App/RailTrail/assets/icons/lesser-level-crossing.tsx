import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"
const LesserLevelCrossing = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={46}
    height={40}
    fill="none"
    {...props}
  >
    <Path
      fill="#FAFAFA"
      stroke="#DE0B0B"
      strokeWidth={4}
      d="M23 37.57 2.464 2h41.072L23 37.57Z"
    />
  </Svg>
)
export default LesserLevelCrossing
