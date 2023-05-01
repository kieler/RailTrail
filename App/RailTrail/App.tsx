import { StatusBar } from "expo-status-bar"
import { StyleSheet, Text, View } from "react-native"
import { HomeScreen } from "./screens/home-screen"

export default function App() {
  return (
    <View style={styles.container}>
      <HomeScreen />
      <StatusBar style="dark" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
})
