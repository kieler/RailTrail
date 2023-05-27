import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { RootNavigation } from "./navigation/root-navigation"
import { SafeAreaView } from "./components/safe-area-view"

export default function App() {
  const Tab = createBottomTabNavigator()

  return (
    <SafeAreaView>
      <RootNavigation />
    </SafeAreaView>
  )
}
