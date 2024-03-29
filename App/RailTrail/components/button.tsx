import {
  View,
  StyleSheet,
  Pressable,
  Text,
  StyleProp,
  ViewStyle,
} from "react-native"
import React from "react"
import { Color } from "../values/color"

interface ExternalProps {
  readonly text: string
  readonly onPress: () => void
  readonly isSecondary?: boolean
  readonly disabled?: boolean
  readonly style?: StyleProp<ViewStyle>
}

type Props = ExternalProps

export const Button = ({
  text,
  onPress,
  isSecondary,
  disabled,
  style,
}: Props) => (
  <Pressable
    onPress={() => {
      if (!disabled) onPress()
    }}
    style={({ pressed }) => [
      style,
      pressed && !disabled ? { opacity: 0.8 } : {},
    ]}
  >
    <View
      style={
        isSecondary
          ? styles.secondary
          : disabled
          ? styles.disabled
          : styles.primary
      }
    >
      <Text
        style={
          isSecondary
            ? disabled
              ? styles.textDisabled
              : styles.textSecondary
            : styles.textPrimary
        }
      >
        {text}
      </Text>
    </View>
  </Pressable>
)

const styles = StyleSheet.create({
  primary: {
    borderRadius: 50,
    padding: 15,
    backgroundColor: Color.primary,
  },
  secondary: {
    borderRadius: 50,
    padding: 15,
  },
  disabled: {
    borderRadius: 50,
    padding: 15,
    backgroundColor: Color.darkGray,
  },
  textPrimary: {
    color: Color.textLight,
    fontSize: 18,
    textAlign: "center",
  },
  textSecondary: {
    color: Color.primary,
    fontSize: 18,
    textAlign: "center",
  },
  textDisabled: {
    color: Color.darkGray,
    fontSize: 18,
    textAlign: "center",
  },
})
