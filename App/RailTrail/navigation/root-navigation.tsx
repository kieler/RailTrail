import { NavigationContainer } from "@react-navigation/native"
import { Platform } from "react-native"
import * as NavigationBar from "expo-navigation-bar"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { LandingPageScreen } from "../screens/landing-page-screen"
import { MainNavigation } from "./main-navigation"
import { TrackSelectionScreen } from "../screens/track-selection-screen"

export const RootNavigation = () => {
  if (Platform.OS === "android") {
    NavigationBar.setBackgroundColorAsync("white")
  }

  const Stack = createNativeStackNavigator()

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing Page"
        screenOptions={() => ({
          headerShown: false,
        })}
      >
        <Stack.Screen
          name="Main"
          component={MainNavigation}
          initialParams={{ hasLocationPermission: false }}
        />
        <Stack.Screen name="Landing Page" component={LandingPageScreen} />
        <Stack.Screen name="Track Selection" component={TrackSelectionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
