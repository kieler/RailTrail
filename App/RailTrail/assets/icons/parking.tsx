import * as React from "react"
import Svg, { SvgProps, Rect, Path } from "react-native-svg"
const Picknick = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={48}
    height={48}
    fill="none"
    {...props}
  >
    <Rect
      width={33.941}
      height={33.941}
      y={24}
      fill="#0076E2"
      rx={5}
      transform="rotate(-45 0 24)"
    />
    <Path
      fill="#fff"
      d="M17.818 36V12.727h7.864c1.826 0 3.318.33 4.477.989 1.167.651 2.03 1.534 2.591 2.648.56 1.113.84 2.356.84 3.727s-.28 2.617-.84 3.738c-.553 1.122-1.41 2.016-2.568 2.682-1.16.66-2.644.989-4.455.989h-5.636V25h5.545c1.25 0 2.254-.216 3.012-.648.757-.431 1.306-1.015 1.648-1.75.348-.742.522-1.58.522-2.511 0-.932-.174-1.765-.523-2.5-.34-.735-.894-1.31-1.659-1.727-.765-.425-1.78-.637-3.045-.637h-4.955V36h-2.818Z"
    />
  </Svg>
)
export default Picknick
