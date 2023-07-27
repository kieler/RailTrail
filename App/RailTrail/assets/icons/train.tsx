import * as React from "react"
import Svg, { SvgProps, Rect, Path } from "react-native-svg"
const Train = (props: SvgProps) => (
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
    <Path
      fill="#000"
      d="M14.255 28.777V17.262c0-.829.192-1.551.576-2.167.384-.617.975-1.122 1.773-1.516.798-.394 1.808-.686 3.03-.878 1.223-.192 2.662-.288 4.319-.288 1.737 0 3.217.09 4.44.272 1.222.182 2.222.47 3 .864.777.394 1.348.894 1.712 1.5.363.606.545 1.344.545 2.213v11.515c0 1.192-.409 2.197-1.227 3.016-.818.818-1.824 1.227-3.015 1.227l1.818 1.818v.606h-2.121L26.68 33.02h-5.455l-2.424 2.424H16.68v-.606l1.818-1.818c-1.192 0-2.197-.41-3.015-1.227-.819-.819-1.228-1.824-1.228-3.016Zm1.819-6.212h7.09v-4.697h-7.09v4.697Zm8.91 0h6.848v-4.697h-6.849v4.697Zm-5.425 6.97c.464 0 .858-.162 1.181-.485.324-.323.485-.717.485-1.182 0-.465-.161-.858-.485-1.182a1.608 1.608 0 0 0-1.181-.485c-.465 0-.859.162-1.182.485a1.609 1.609 0 0 0-.485 1.182c0 .465.162.859.485 1.182.323.323.717.485 1.182.485Zm8.788 0c.465 0 .858-.162 1.182-.485.323-.323.485-.717.485-1.182 0-.465-.162-.858-.485-1.182a1.608 1.608 0 0 0-1.182-.485c-.465 0-.859.162-1.182.485a1.608 1.608 0 0 0-.485 1.182c0 .465.162.859.485 1.182.323.323.717.485 1.182.485Z"
    />
  </Svg>
)
export default Train