import { NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { HomeScreen } from "../screens/home-screen"
import { InfoScreen } from "../screens/info-screen"
import { Color } from "../values/color"
import { Platform } from "react-native"
import * as NavigationBar from "expo-navigation-bar"

export const RootNavigation = () => {
  if (Platform.OS === "android") {
    NavigationBar.setBackgroundColorAsync("white")
  }

  const Tab = createBottomTabNavigator()

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any

            if (route.name === "Karte") {
              iconName = focused ? "map" : "map-outline"
            } else if (route.name === "Info") {
              iconName = focused ? "information" : "information-outline"
            }
            return (
              <MaterialCommunityIcons
                name={iconName}
                size={size}
                color={color}
              />
            )
          },
          tabBarActiveTintColor: Color.primary,
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Karte" component={HomeScreen} />
        <Tab.Screen name="Info" component={InfoScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
