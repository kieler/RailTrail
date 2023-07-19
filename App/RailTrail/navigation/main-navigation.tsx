import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { HomeScreen } from "../screens/home-screen"
import { InfoScreen } from "../screens/info-screen"
import { Color } from "../values/color"

export const MainNavigation = ({ route }: any) => {
  const { hasLocationPermission } = route.params
  const Tab = createBottomTabNavigator()

  return (
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
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          )
        },
        tabBarActiveTintColor: Color.primary,
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="Karte"
        component={HomeScreen}
        initialParams={{ hasLocationPermission: hasLocationPermission }}
      />
      <Tab.Screen name="Info" component={InfoScreen} />
    </Tab.Navigator>
  )
}
