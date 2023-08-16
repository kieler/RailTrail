import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"
const TrainForeground = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={24}
    viewBox="0 0 20 24"
    fill="none"
    {...props}
  >
    <Path
      fill="#000"
      d="M.255 16.777V5.262c0-.829.192-1.551.576-2.167.384-.616.975-1.122 1.773-1.515.798-.394 1.808-.687 3.03-.88C6.857.51 8.296.414 9.953.414c1.737 0 3.217.09 4.44.273 1.222.181 2.222.47 3 .863.777.394 1.348.894 1.712 1.5.363.606.545 1.344.545 2.213v11.515c0 1.192-.409 2.197-1.227 3.016-.818.818-1.823 1.227-3.015 1.227l1.818 1.818v.606h-2.121L12.68 21.02H7.225l-2.424 2.424H2.68v-.606l1.818-1.818c-1.192 0-2.197-.41-3.015-1.227-.819-.819-1.228-1.824-1.228-3.016Zm1.819-6.212h7.09V5.868h-7.09v4.697Zm8.91 0h6.848V5.868h-6.849v4.697Zm-5.425 6.97c.464 0 .858-.162 1.181-.485.324-.323.485-.717.485-1.182 0-.465-.161-.859-.485-1.182a1.608 1.608 0 0 0-1.181-.485c-.465 0-.859.162-1.182.485a1.608 1.608 0 0 0-.485 1.182c0 .465.161.859.485 1.182.323.323.717.485 1.182.485Zm8.788 0c.465 0 .859-.162 1.182-.485.323-.323.485-.717.485-1.182 0-.465-.162-.859-.485-1.182a1.608 1.608 0 0 0-1.182-.485c-.465 0-.859.162-1.182.485a1.608 1.608 0 0 0-.485 1.182c0 .465.162.859.485 1.182.323.323.717.485 1.182.485Z"
    />
  </Svg>
)
export default TrainForeground