import * as React from "react"
import Svg, { SvgProps, G, Rect, Path, Defs, ClipPath } from "react-native-svg"
const TrackEnd = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    fill="none"
    {...props}
  >
    <G clipPath="url(#a)">
      <Rect
        width={33.941}
        height={33.941}
        y={24}
        fill="#FAFAFA"
        rx={5}
        transform="rotate(-45 0 24)"
      />
      <Path
        fill="#282828"
        d="M31.826 15.957a1.957 1.957 0 1 1 3.913 0V35h-3.913V15.956ZM12.26 15.957a1.957 1.957 0 1 1 3.913 0V35h-3.912V15.956Z"
      />
      <Path fill="#282828" d="M9 15.909h30v4.455H9z" />
      <Path
        stroke="#282828"
        strokeWidth={2}
        d="M0-1h23.237"
        transform="matrix(.87006 .49295 -.51138 .85936 13.565 22.273)"
      />
      <Path
        stroke="#282828"
        strokeWidth={2}
        d="M0-1h23.237"
        transform="matrix(.87006 -.49295 .51138 .85936 14.217 33.727)"
      />
      <Path
        fill="#FAFAFA"
        d="M11.935 15.91h1.63l-2.608 4.454H9.652l2.283-4.455ZM9 15.91h.652L9 17.022v-1.114ZM15.848 15.91h1.63l-2.609 4.454h-1.304l2.283-4.455ZM19.76 15.91h1.631l-2.608 4.454h-1.305l2.283-4.455ZM23.674 15.91h1.63l-2.608 4.454H21.39l2.283-4.455ZM27.587 15.91h1.63l-2.608 4.454h-1.305l2.283-4.455ZM31.5 15.91h1.63l-2.608 4.454h-1.305l2.283-4.455ZM35.413 15.91h1.63l-2.608 4.454H33.13l2.283-4.455ZM39 16.546v2.545l-.652 1.273h-1.305L39 16.545Z"
      />
    </G>
    <Defs>
      <ClipPath id="a">
        <Path fill="#fff" d="M0 0h48v48H0z" />
      </ClipPath>
    </Defs>
  </Svg>
)
export default TrackEnd
