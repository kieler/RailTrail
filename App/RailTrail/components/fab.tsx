import { View, StyleSheet, Pressable } from "react-native"
import React from "react"

interface ExternalProps {
  readonly onPress: () => void
  readonly children: JSX.Element
}

type Props = ExternalProps

export const FAB = ({ onPress, children }: Props) => (
  <View style={styles.alignEnd}>
    <Pressable
      onPress={() => {
        onPress()
      }}
      style={styles.container}
    >
      {children}
    </Pressable>
  </View>
)

const styles = StyleSheet.create({
  alignEnd: {
    alignSelf: "flex-end",
  },
  container: {
    margin: 10,
    padding: 12,
    borderRadius: 15,
    backgroundColor: "white",
  },
})
