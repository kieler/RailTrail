import React, { Children, PropsWithChildren } from "react"
import { StatusBar, StyleProp, StyleSheet, View, ViewStyle } from "react-native"
import { Color } from "../values/color"
import Constants from "expo-constants"

export const SafeAreaView = ({ children }: PropsWithChildren) => {
  return (
    <View style={styles.statusBar}>
      <View style={styles.container}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  statusBar: { flex: 1, width: "100%", backgroundColor: Color.backgroundLight },
  container: {
    flex: 1,
    width: "100%",
    marginTop: Constants.statusBarHeight,
    backgroundColor: Color.backgroundLight,
  },
})
