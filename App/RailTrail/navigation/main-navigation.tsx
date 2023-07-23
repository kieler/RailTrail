import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { HomeScreen } from "../screens/home-screen"
import { InfoScreen } from "../screens/info-screen"
import { Color } from "../values/color"
import { useTranslation } from "../hooks/use-translation"

export const MainNavigation = () => {
  const Tab = createBottomTabNavigator()
  const localizedStrings = useTranslation()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any

          if (route.name === localizedStrings.t("navigationMap")) {
            iconName = focused ? "map" : "map-outline"
          } else if (route.name === localizedStrings.t("navigationInfo")) {
            iconName = focused ? "information" : "information-outline"
          }
          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          )
        },
        tabBarActiveTintColor: Color.primary,
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name={localizedStrings.t("navigationMap")}
        component={HomeScreen}
      />
      <Tab.Screen
        name={localizedStrings.t("navigationInfo")}
        component={InfoScreen}
      />
    </Tab.Navigator>
  )
}
