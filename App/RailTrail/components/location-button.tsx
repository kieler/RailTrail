import React from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { Color } from "../values/color"
import { FAB } from "./fab"

interface ExternalProps {
  readonly onPress: () => void
  readonly isActive: boolean
}

type Props = ExternalProps

export const LocationButton = ({ onPress, isActive }: Props) => (
  <FAB onPress={onPress}>
    {isActive ? (
      <MaterialIcons name="my-location" size={30} color={Color.primary} />
    ) : (
      <MaterialIcons name="location-searching" size={30} color={Color.black} />
    )}
  </FAB>
)
