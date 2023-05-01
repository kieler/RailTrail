import { Platform, StyleSheet, View, Text, AppState } from "react-native"
import { SafeAreaView } from "../components/safe-area-view"
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps"
import * as TaskManager from "expo-task-manager"

import * as Location from "expo-location"
import { Ref, createRef, useEffect, useRef, useState } from "react"
import { addLocationToFilesystem } from "../filessystem/files"

export const HomeScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject>()
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [region, setRegion] = useState<Region>()
  const [permissions, setPermissions] = useState<Boolean>(false)

  const mapRef: any = useRef(null)

  const appState = useRef(AppState.currentState)
  const [appStateVisible, setAppStateVisible] = useState(appState.current)

  let fileContent = ""

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

    // await Location.watchPositionAsync(
    //   { accuracy: Location.LocationAccuracy.BestForNavigation },
    //   handleLocationUpdate
    // ) //getCurrentPositionAsync({})
    // setLocation(location)

    // setRegion({
    //   latitude: location.coords.latitude,
    //   longitude: location.coords.longitude,
    //   latitudeDelta: 0.04,
    //   longitudeDelta: 0.02,
    // })
  }

  const getPermissions = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied")
      setPermissions(false)
      return
    } else {
      let { status: statusBackground } =
        await Location.requestBackgroundPermissionsAsync()
      if (statusBackground !== "granted") {
        setErrorMsg("Permission to access location was denied")
        setPermissions(false)
        return
      } else {
        console.log("Permission granted")
        setPermissions(true)
      }
    }
  }

  const handleLocationUpdate = async (location: Location.LocationObject) => {
    setLocation(location)

    const r = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.005,
    }

    setRegion(r)

    if (r && mapRef) {
      mapRef.current.animateToRegion(r, 250)
    }
  }

  useEffect(() => {
    getPermissions()

    addLocationToFilesystem("1", "test string")

    const id = Date.now().toString()

    TaskManager.defineTask("YOUR_TASK_NAME", ({ data, error }: any) => {
      if (error) {
        // check `error.message` for more details.
        console.log(error.message)
        return
      }
      console.log("Received new locations", data.locations)
      if (appStateVisible) handleLocationUpdate(data.locations[0])

      fileContent = fileContent.concat(JSON.stringify(data.locations[0]) + "\n")
      addLocationToFilesystem(id, fileContent)
    })
  }, [])

  useEffect(() => {
    if (permissions && TaskManager.isTaskDefined("YOUR_TASK_NAME"))
      Location.startLocationUpdatesAsync("YOUR_TASK_NAME", {
        accuracy: Location.LocationAccuracy.BestForNavigation,
      })
  }, [TaskManager.isTaskDefined("YOUR_TASK_NAME"), permissions])

  let text = "Waiting.."
  if (errorMsg) {
    text = errorMsg
  } else if (location) {
    text = JSON.stringify(location)
  }

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
        >
          {location ? (
            <Marker
              key={0}
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title={"marker.title"}
            />
          ) : null}
        </MapView>
      </View>
      <Text style={{ position: "absolute" }}>{text}</Text>
    </SafeAreaView>
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
