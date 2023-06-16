import * as React from "react"
import Svg, { SvgProps, Rect, Path } from "react-native-svg"
const Picnic = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    viewBox="0 0 48 48"
    fill="none"
    {...props}
  >
    <Rect
      width={33.941}
      height={33.941}
      y={24}
      fill="#FAFAFA"
      rx={5}
      transform="rotate(-45 0 24)"
    />
    <Path fill="#595959" d="M13 14h22v3H13v-3ZM9 25h30v1H9z" />
    <Path fill="#595959" d="M19 17h3l-6 18h-3l6-18ZM26 17h3l6.5 18h-3L26 17Z" />
  </Svg>
)
export default Picnic
