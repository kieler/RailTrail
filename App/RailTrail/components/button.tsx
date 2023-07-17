import {
  View,
  StyleSheet,
  Pressable,
  Text,
  StyleProp,
  ViewStyle,
} from "react-native"
import React from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { Color } from "../values/color"
import { textStyles } from "../values/text-styles"

interface ExternalProps {
  readonly text: string
  readonly onPress: () => void
  readonly isSecondary?: boolean
  readonly style?: StyleProp<ViewStyle>
}

type Props = ExternalProps

export const Button = ({ text, onPress, isSecondary, style }: Props) => (
  <Pressable
    onPress={() => {
      onPress()
    }}
    style={({ pressed }) => [style, pressed ? { opacity: 0.8 } : {}]}
  >
    <View style={isSecondary ? styles.secondary : styles.primary}>
      <Text style={isSecondary ? styles.textSecondary : styles.textPrimary}>
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
})
