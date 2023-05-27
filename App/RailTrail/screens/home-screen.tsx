import { Platform, StyleSheet, View, Text, AppState } from "react-native"
import { useKeepAwake } from "expo-keep-awake"
import { SafeAreaView } from "../components/safe-area-view"
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps"
import * as TaskManager from "expo-task-manager"

import * as Location from "expo-location"
import { Ref, createRef, useEffect, useRef, useState } from "react"
import { Header } from "../components/header"
import Train from "../assets/icons/train"
import { retrieveInitData } from "../effect-actions/actions"
import { request } from "../types/init"
import { Snackbar, SnackbarState } from "../components/snackbar"
import { Color } from "../values/color"

export const HomeScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject>()
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [region, setRegion] = useState<Region>()
  const [permissions, setPermissions] = useState<Boolean>(false)

  const mapRef: any = useRef(null)

  const appState = useRef(AppState.currentState)
  const [appStateVisible, setAppStateVisible] = useState(appState.current)

  const [distance, setDistance] = useState<number>(1234)
  const [speed, setSpeed] = useState<number>(0)
  const [nextVehicle, setNextVehicle] = useState<number>(234)
  const [nextLevelCrossing, setNextLevelCrossing] = useState<number>(80)

  useKeepAwake()

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("App has come to the foreground!")
      }

      appState.current = nextAppState
      setAppStateVisible(appState.current)
      console.log("AppState", appState.current)
    })

    getPermissions()

    //getLocation()

    //retrieveInitData(request)

    return () => {
      subscription.remove()
    }
  }, [])

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied")
      return
    }
  }

  const getPermissions = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied")
      setPermissions(false)
      return
    } else {
      console.log("Permission granted")
      setPermissions(true)
      // let { status: statusBackground } =
      //   await Location.requestBackgroundPermissionsAsync()
      // if (statusBackground !== "granted") {
      //   setErrorMsg("Permission to access location was denied")
      //   setPermissions(false)
      //   return
      // } else {
      //   console.log("Permission granted")
      //   setPermissions(true)
      // }
    }
  }

  const handleLocationUpdate = async (location: Location.LocationObject) => {
    setLocation(location)

    const r = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.002,
    }

    setRegion(r)

    if (r && mapRef) {
      // mapRef.current.animateToRegion(r, 190)
      mapRef.current.animateCamera(
        {
          center: {
            latitude: r.latitude,
            longitude: r.longitude,
          },
          heading: location.coords.heading,
        },
        { duration: 250 }
      )
    }

    if (errorMsg) {
    } else if (location) {
      setSpeed((location.coords.speed ?? 0) * 3.6)
    }
  }

  useEffect(() => {
    if (permissions) {
      Location.watchPositionAsync(
        {
          timeInterval: 0.1,
          distanceInterval: 0.1,
          accuracy: Location.LocationAccuracy.BestForNavigation,
        },
        handleLocationUpdate
      )
    }
  }, [permissions])

  // useEffect(() => {
  //   getPermissions()

  //   TaskManager.defineTask("YOUR_TASK_NAME", ({ data, error }: any) => {
  //     if (error) {
  //       // check `error.message` for more details.
  //       console.log(error.message)
  //       return
  //     }
  //     console.log("Received new locations", data.locations)
  //     if (appStateVisible) handleLocationUpdate(data.locations[0])
  //   })
  // }, [])

  // useEffect(() => {
  //   if (permissions && TaskManager.isTaskDefined("YOUR_TASK_NAME"))
  //     Location.startLocationUpdatesAsync("YOUR_TASK_NAME", {
  //       accuracy: Location.LocationAccuracy.BestForNavigation,
  //     })
  // }, [TaskManager.isTaskDefined("YOUR_TASK_NAME"), permissions])

  return (
    <View style={styles.container}>
      <Header
        distance={distance}
        speed={speed}
        nextVehicle={nextVehicle}
        nextCrossing={nextLevelCrossing}
      />
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 54.323334,
          longitude: 10.139444,
          latitudeDelta: 0.002,
          longitudeDelta: 0.001,
        }}
        mapType="hybrid"
        showsUserLocation
        showsMyLocationButton={false}
        loadingEnabled
      >
        {/* {location ? (
            <Marker
              key={0}
              anchor={{ x: 0.5, y: 0.5 }}
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
            >
              <Train />
            </Marker>
          ) : null} */}
      </MapView>
      {nextLevelCrossing < 100 ? (
        <Snackbar
          title="Warnung"
          message={`Bahnübergang in ${nextLevelCrossing}m`}
          state={SnackbarState.WARNING}
        />
      ) : nextVehicle < 100 ? (
        <Snackbar
          title="Warnung"
          message={`Fahrzeug in ${nextVehicle}m`}
          state={SnackbarState.WARNING}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  map: {
    flex: 1,
    width: "100%",
  },
})
