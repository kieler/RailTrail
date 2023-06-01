import { Platform, StyleSheet, View, Text, AppState } from "react-native"
import { useKeepAwake } from "expo-keep-awake"
import { SafeAreaView } from "../components/safe-area-view"
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps"
import * as TaskManager from "expo-task-manager"

import * as Location from "expo-location"
import { Ref, createRef, useEffect, useRef, useState } from "react"
import { Header } from "../components/header"
import Train from "../assets/icons/train"
import { retrieveInitData, retrieveUpdateData } from "../effect-actions/actions"
import { PointOfInterest, request } from "../types/init"
import { Snackbar, SnackbarState } from "../components/snackbar"
import { Color } from "../values/color"
import { Backend } from "../api/backend"
import { PointOfInterestMarker } from "../components/point-of-interest-marker"
import { InitRequest } from "../types/init"
import { UpdateRequest } from "../types/update"
import { Vehicle } from "../types/vehicle"

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  const [vehicleId, setVehicleId] = useState<number | undefined>()
  const [trackStart, setTrackStart] = useState<string>("")
  const [trackEnd, setTrackEnd] = useState<string>("")
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>(
    []
  )

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

    getPermissions().then(async (permissionsGranted) => {
      let initRequest: InitRequest
      if (permissionsGranted) {
        const location = await Location.getCurrentPositionAsync({})
        initRequest = {
          pos: {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          },
        }
      } else {
        initRequest = {}
      }

      retrieveInitData(initRequest).then((response) => {
        setTrackStart(response.trackStart)
        setTrackEnd(response.trackEnd)
        setPointsOfInterest(response.pointsOfInterest)
      })
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const getPermissions = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied")
      setPermissions(false)
      return false
    } else {
      console.log("Permission granted")
      setPermissions(true)
      return true
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

    const updateReqest: UpdateRequest = {
      vehicleId: vehicleId,
      pos: { lat: location.coords.latitude, lng: location.coords.longitude },
      speed: location.coords.speed ?? undefined,
      timestamp: location.timestamp,
      direction: location.coords.heading ?? undefined,
    }

    retrieveUpdateData(updateReqest).then((response) => {
      if (response.vehicleId) setVehicleId(response.vehicleId)
      if (response.distanceTraveled) setDistance(response.distanceTraveled)
      if (response.distanceToNextVehicle)
        setNextVehicle(response.distanceToNextVehicle)
      if (response.distanceToNextCrossing)
        setNextLevelCrossing(response.distanceToNextCrossing)
      if (response.vehiclesNearUser) setVehicles(response.vehiclesNearUser)
    })

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
        {pointsOfInterest.map((poi, index) => {
          return (
            <Marker
              key={index}
              anchor={{ x: 0.5, y: 0.5 }}
              coordinate={{
                latitude: poi.pos.lat,
                longitude: poi.pos.lng,
              }}
            >
              <PointOfInterestMarker pointOfInterestType={poi.type} />
            </Marker>
          )
        })}
        {vehicles.map((vehicle, index) => {
          return (
            <Marker
              key={index}
              anchor={{ x: 0.5, y: 0.5 }}
              coordinate={{
                latitude: vehicle.pos.lat,
                longitude: vehicle.pos.lng,
              }}
            >
              <Train />
            </Marker>
          )
        })}
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
