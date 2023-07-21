import { RootNavigation } from "./navigation/root-navigation"
import { SafeAreaView } from "./components/safe-area-view"
import { StatusBar } from "expo-status-bar"
import { initStore } from "./redux/init"
import { Provider } from "react-redux"

export default function App() {
  const { store } = initStore()

  return (
    <SafeAreaView>
      <Provider store={store}>
        <RootNavigation />
        <StatusBar style="dark" />
      </Provider>
    </SafeAreaView>
  )
}
