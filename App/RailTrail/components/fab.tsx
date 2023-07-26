import { View, StyleSheet, Pressable } from "react-native"
import React, { ReactNode } from "react"

interface ExternalProps {
  readonly onPress: () => void
  readonly children: JSX.Element
}

type Props = ExternalProps

export const FAB = ({ onPress, children }: Props) => (
  <Pressable
    onPress={() => {
      onPress()
    }}
  >
    <View style={styles.container}>{children}</View>
  </Pressable>
)

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-end",
    margin: 10,
    padding: 12,
    borderRadius: 15,
    backgroundColor: "white",
  },
})
