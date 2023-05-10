import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"
const SvgComponent = (props: SvgProps) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={63}
    height={63}
    fill="none"
    {...props}
  >
    <Path
      fill="#DE0B0B"
      stroke="#fff"
      strokeWidth={2}
      d="m10.184 22.587 12.403-12.403h17.54l12.404 12.403v17.54L40.128 52.532h-17.54L10.183 40.128v-17.54Z"
    />
    <Path
      fill="#fff"
      d="M19.401 29.364a1.56 1.56 0 0 0-.726-1.174c-.424-.278-.944-.417-1.56-.417-.451 0-.846.073-1.184.218a1.889 1.889 0 0 0-.785.602 1.442 1.442 0 0 0-.279.87c0 .272.065.505.194.701.133.192.302.353.507.482.206.126.421.23.646.313.226.08.433.145.622.194l1.034.279c.265.07.56.166.885.288.328.123.641.29.94.502.301.21.55.478.745.806.196.328.293.73.293 1.208a2.68 2.68 0 0 1-.432 1.491c-.285.444-.703.797-1.253 1.06-.547.261-1.211.392-1.993.392-.73 0-1.361-.118-1.895-.353-.53-.235-.947-.563-1.252-.984a2.808 2.808 0 0 1-.512-1.467h1.272c.033.385.163.703.388.955a2.1 2.1 0 0 0 .865.556c.351.12.73.18 1.134.18.47 0 .893-.077 1.267-.23.375-.155.672-.37.89-.646.219-.278.328-.603.328-.974 0-.338-.094-.613-.283-.825a2.08 2.08 0 0 0-.746-.517 7.823 7.823 0 0 0-1-.348l-1.252-.358c-.795-.23-1.425-.555-1.89-.98-.463-.424-.695-.98-.695-1.665 0-.57.154-1.067.462-1.492.312-.427.73-.759 1.253-.994a4.231 4.231 0 0 1 1.765-.358c.656 0 1.24.118 1.75.353.51.232.915.55 1.213.954.302.405.46.864.477 1.378h-1.193Zm2.803-1.452v-1.094h7.636v1.094H26.64V37h-1.233v-9.088h-3.202Zm17.706 3.997c0 1.074-.194 2.002-.581 2.784-.388.782-.92 1.386-1.596 1.81-.676.424-1.449.636-2.317.636-.868 0-1.64-.212-2.317-.636-.676-.424-1.208-1.028-1.596-1.81-.387-.782-.581-1.71-.581-2.784 0-1.074.194-2.002.581-2.784.388-.782.92-1.385 1.596-1.81.676-.424 1.449-.636 2.317-.636.868 0 1.64.212 2.317.636.676.425 1.208 1.028 1.596 1.81.387.782.581 1.71.581 2.784Zm-1.193 0c0-.881-.148-1.626-.442-2.232-.292-.607-.688-1.066-1.189-1.377a3.081 3.081 0 0 0-1.67-.468c-.617 0-1.175.156-1.675.468-.498.311-.894.77-1.189 1.377-.291.606-.437 1.35-.437 2.232 0 .882.146 1.626.437 2.232.295.607.691 1.066 1.188 1.378.5.311 1.06.467 1.676.467.616 0 1.173-.156 1.67-.467.5-.312.897-.771 1.189-1.378.294-.606.442-1.35.442-2.232ZM41.983 37V26.818h3.44c.8 0 1.452.144 1.96.433.51.285.888.67 1.133 1.158.245.487.368 1.03.368 1.63 0 .6-.123 1.146-.368 1.636-.242.491-.616.882-1.124 1.174-.507.288-1.156.432-1.948.432h-2.466v-1.093h2.426c.547 0 .986-.095 1.317-.284a1.69 1.69 0 0 0 .721-.765c.153-.325.229-.692.229-1.1 0-.407-.076-.772-.229-1.093a1.632 1.632 0 0 0-.726-.756c-.334-.185-.779-.278-1.332-.278h-2.168V37h-1.233Z"
    />
  </Svg>
)
export default SvgComponent
