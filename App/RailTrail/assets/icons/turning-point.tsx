import * as React from "react"
import Svg, { SvgProps, Rect, Path, Circle } from "react-native-svg"
const TurningPoint = (props: SvgProps) => (
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
    <Circle
      cx={24}
      cy={24}
      r={11}
      fill="#FAFAFA"
      stroke="#282828"
      strokeWidth={2}
    />
    <Path
      fill="#FAFAFA"
      d="m31.085 30.855 1.499-4.77 4.77 1.5-1.5 4.769-4.77-1.5ZM11.74 32.593l2.984-4.012 4.012 2.984-2.985 4.012-4.011-2.984ZM20.5 10.5l4.909-.95.95 4.909-4.909.95-.95-4.909Z"
    />
    <Path
      fill="#282828"
      d="m33.902 28.7.267 4.593L29.5 30.04l4.402-1.34ZM16.116 31.766l-4.376-1.422 4.728-3.166-.352 4.588ZM23.345 12.94l3.89-2.459-.585 5.66-3.305-3.201Z"
    />
  </Svg>
)
export default TurningPoint
