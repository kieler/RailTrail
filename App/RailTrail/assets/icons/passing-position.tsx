import * as React from "react"
import Svg, { SvgProps, Path, Rect } from "react-native-svg"
const PassingPosition = (props: SvgProps) => (
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
    <Path fill="#282828" d="M26 10h2v28h-2V10Z" />
    <Path fill="#282828" d="M33 24c0 4.97-3.134 9-7 9V15c3.866 0 7 4.03 7 9Z" />
    <Path
      fill="#282828"
      d="M33 24c0 4.97-3.134 9-7 9V15c3.866 0 7 4.03 7 9ZM27 6l2.598 4.5h-5.196L27 6Z"
    />
    <Path
      fill="#FAFAFA"
      d="M31 24c0 3.866-2.239 7-5 7V17c2.761 0 5 3.134 5 7Z"
    />
    <Path
      fill="#FAFAFA"
      d="M31 24c0 3.866-2.239 7-5 7V17c2.761 0 5 3.134 5 7Z"
    />
    <Path fill="#282828" d="M22 38h-2V10h2v28Z" />
    <Path
      fill="#282828"
      d="M15 24c0-4.97 3.134-9 7-9v18c-3.866 0-7-4.03-7-9Z"
    />
    <Path
      fill="#282828"
      d="M15 24c0-4.97 3.134-9 7-9v18c-3.866 0-7-4.03-7-9ZM21 42l-2.598-4.5h5.196L21 42Z"
    />
    <Path
      fill="#FAFAFA"
      d="M17 24c0-3.866 2.239-7 5-7v14c-2.761 0-5-3.134-5-7Z"
    />
    <Path
      fill="#FAFAFA"
      d="M17 24c0-3.866 2.239-7 5-7v14c-2.761 0-5-3.134-5-7Z"
    />
  </Svg>
)
export default PassingPosition
