import { StyleSheet, View, AppState } from "react-native"
import { useKeepAwake } from "expo-keep-awake"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import { useEffect, useRef, useState } from "react"
import { Header } from "../components/header"
import Train from "../assets/icons/train"
import {
  retrieveInitData,
  retrieveUpdateData,
} from "../effect-actions/api-actionss"
import { InitResponse, PointOfInterest } from "../types/init"
import { Snackbar, SnackbarState } from "../components/snackbar"
import { PointOfInterestMarker } from "../components/point-of-interest-marker"
import { UpdateResponse } from "../types/update"
import { Vehicle } from "../types/vehicle"
import { getPermissions } from "../effect-actions/permissions"
import { setLocationListener } from "../effect-actions/location"

export const HomeScreen = () => {
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
    getPermissions(setPermissions)
  }, [])

  useEffect(() => {
    if (permissions) {
      retrieveInitData(true, setInitData)
      setLocationListener(handleLocationUpdate)
    } else {
      retrieveInitData(false, setInitData)
    }
  }, [permissions])

  const handleLocationUpdate = async (location: Location.LocationObject) => {
    retrieveUpdateData(setUpdateData, location, vehicleId)
    setLocationVariables(location)
  }

  const setInitData = (initResponse: InitResponse) => {
    setTrackStart(initResponse.trackStart)
    setTrackEnd(initResponse.trackEnd)
    setPointsOfInterest(initResponse.pointsOfInterest)
    return {}
  }

  const setUpdateData = (updateResponse: UpdateResponse) => {
    if (updateResponse.vehicleId) setVehicleId(updateResponse.vehicleId)
    if (updateResponse.distanceTraveled)
      setDistance(updateResponse.distanceTraveled)
    if (updateResponse.distanceToNextVehicle)
      setNextVehicle(updateResponse.distanceToNextVehicle)
    if (updateResponse.distanceToNextCrossing)
      setNextLevelCrossing(updateResponse.distanceToNextCrossing)
    if (updateResponse.vehiclesNearUser)
      setVehicles(updateResponse.vehiclesNearUser)
    return {}
  }

  const setLocationVariables = (location: Location.LocationObject) => {
    if (mapRef) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          heading: location.coords.heading,
        },
        { duration: 250 }
      )
    }

    setSpeed((location.coords.speed ?? 0) * 3.6)
  }

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
