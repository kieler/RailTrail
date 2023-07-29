import { View, StyleSheet, StyleProp, ViewStyle } from "react-native"
import React from "react"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Color } from "../values/color"

interface ExternalProps {
  readonly isChecked: boolean
  readonly setIsChecked: React.Dispatch<React.SetStateAction<boolean>>
  readonly children?: JSX.Element
  readonly style?: StyleProp<ViewStyle>
}

type Props = ExternalProps

export const Checkbox = ({
  isChecked,
  setIsChecked,
  children,
  style,
}: Props) => {
  return (
    <View style={[styles.container, style]}>
      {isChecked ? (
        <MaterialCommunityIcons
          name="checkbox-marked"
          size={24}
          color={Color.primary}
          onPress={() => {
            setIsChecked(false)
          }}
        />
      ) : (
        <MaterialCommunityIcons
          name="checkbox-blank-outline"
          size={24}
          color="black"
          onPress={() => {
            setIsChecked(true)
          }}
        />
      )}
      <View style={styles.childrenContainer}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  childrenContainer: {
    marginStart: 10,
  },
})
