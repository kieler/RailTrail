import { View, StyleSheet, StyleProp, ViewStyle, Pressable } from "react-native"
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
    <Pressable
      style={[styles.container, style]}
      onPress={() => {
        setIsChecked(!isChecked)
      }}
    >
      {isChecked ? (
        <MaterialCommunityIcons
          name="checkbox-marked"
          size={24}
          color={Color.primary}
        />
      ) : (
        <MaterialCommunityIcons
          name="checkbox-blank-outline"
          size={24}
          color="black"
        />
      )}
      <View style={styles.childrenContainer}>{children}</View>
    </Pressable>
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
