import { RootNavigation } from "./navigation/root-navigation"
import { SafeAreaView } from "./components/safe-area-view"
import { StatusBar } from "expo-status-bar"

export default function App() {
  return (
    <SafeAreaView>
      <RootNavigation />
      <StatusBar style="dark" />
    </SafeAreaView>
  )
}
