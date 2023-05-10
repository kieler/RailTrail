import * as React from "react"
import Svg, { SvgProps, Path, Rect } from "react-native-svg"
const SvgComponent = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    viewBox="0 96 960 960"
    fill={"#000"}
    {...props}
  >
    <Rect
      x="15"
      y="15"
      width="70"
      height="70"
      stroke="red"
      strokeWidth="2"
      fill="yellow"
    />
    <Path d="M160 716V336q0-41 19-71.5t58.5-50q39.5-19.5 100-29T480 176q86 0 146.5 9t99 28.5Q764 233 782 263t18 73v380q0 59-40.5 99.5T660 856l60 60v20h-70l-80-80H390l-80 80h-70v-20l60-60q-59 0-99.5-40.5T160 716Zm60-205h234V356H220v155Zm294 0h226V356H514v155ZM335 741q23 0 39-16t16-39q0-23-16-39t-39-16q-23 0-39 16t-16 39q0 23 16 39t39 16Zm290 0q23 0 39-16t16-39q0-23-16-39t-39-16q-23 0-39 16t-16 39q0 23 16 39t39 16Z" />
  </Svg>
)
export default SvgComponent
