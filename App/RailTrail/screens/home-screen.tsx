import { StyleSheet, View, Alert, Platform } from "react-native"
import { useKeepAwake } from "expo-keep-awake"
import MapView, { PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import { useEffect, useRef, useState } from "react"
import { Header } from "../components/header"
import {
  retrieveInitDataWithPosition,
  retrieveUpdateDataInternalPosition,
} from "../effect-actions/api-actions"
import { InitResponse, PointOfInterest } from "../types/init"
import { Snackbar, SnackbarState } from "../components/snackbar"
import { Vehicle } from "../types/vehicle"
import {
  getPermissionStatus,
  getPermissions,
} from "../effect-actions/permissions"
import { setLocationListener } from "../effect-actions/location"
import { initialRegion, track } from "../util/consts"
import { LocationButton } from "../components/location-button"
import { UpdateResponseInternalPosition } from "../types/update"
import { MapMarkers } from "../components/map-markers"

export const HomeScreen = () => {
  const [permissions, setPermissions] = useState<Boolean>(false)
  const [isTripStarted, setIsTripStarted] = useState<Boolean>(false)
  const [location, setLocation] = useState<Location.LocationObject>()

  const mapRef: any = useRef(null)
  // Used to determine if the map should update
  const isFollowingUser = useRef<boolean>(true)
  // Used to set and update location icon
  const [isFollowingUserState, setIsFollowingUserState] =
    useState<boolean>(true)
  const [useSmallMarker, setUseSmallMarker] = useState<boolean>(false)

  const [
    isAndroidVehicleNumberDialogVisible,
    setIsAndroidVehicleNumberDialogVisible,
  ] = useState(false)

  const [distance, setDistance] = useState<number>(1234)
  const [speed, setSpeed] = useState<number>(0)
  const [nextVehicle, setNextVehicle] = useState<number>(234)
  const [nextLevelCrossing, setNextLevelCrossing] = useState<number>(120)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [percentagePositionOnTrack, setPercentagePositionOnTrack] =
    useState<number>(0)

  const [vehicleId, setVehicleId] = useState<number>(1)
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>(
    []
  )

  const [modalVisible, setModalVisible] = useState(false)

  useKeepAwake()

  useEffect(() => {
    getPermissionStatus().then((isPermissionGrated) => {
      setPermissions(isPermissionGrated)
      if (!isPermissionGrated) {
        Alert.alert(
          "Standortdaten benutzen?",
          "Durch das aktivieren von Standortdaten kann die Genuigkeit verbessert und Ihnen zusäzliche Fahrtinformationen angezeigt werden.",
          [
            {
              text: "Ablehnen",
              onPress: () => console.log("Cancel Pressed"),
            },
            { text: "Weiter", onPress: () => getPermissions(setPermissions) },
          ]
        )
      }
    })
  }, [])

  useEffect(() => {
    //TODO: Avoid initial call
    if (permissions) {
      retrieveInitDataWithPosition(setInitData)
      setLocationListener(handleLocationUpdate)
    } else {
      // TODO
      //retrieveInitData(false, setInitData)
    }
  }, [permissions])

  const onLocationButtonClicked = () => {
    isFollowingUser.current = !isFollowingUser.current
    setIsFollowingUserState(isFollowingUser.current)
    if (isFollowingUser.current && location) setLocationVariables(location)
  }

  const onMapDrag = () => {
    if (isFollowingUser.current) {
      isFollowingUser.current = false
      setIsFollowingUserState(false)
    }
  }

  const handleLocationUpdate = async (location: Location.LocationObject) => {
    retrieveUpdateDataInternalPosition(setUpdateData, location, vehicleId)
    setLocationVariables(location)
  }

  const setInitData = (initResponse: InitResponse) => {
    setPointsOfInterest(initResponse.pointsOfInterest)
    return {}
  }

  const setUpdateData = (updateResponse: UpdateResponseInternalPosition) => {
    setPercentagePositionOnTrack(updateResponse.percentagePositionOnTrack)
    if (updateResponse.vehiclesNearUser)
      setVehicles(updateResponse.vehiclesNearUser)
    return {}
  }

  const setLocationVariables = (location: Location.LocationObject) => {
    setLocation(location)

    if (mapRef && isFollowingUser.current) {
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
        initialRegion={initialRegion}
        mapType="hybrid"
        showsUserLocation={false}
        showsMyLocationButton={false}
        onPanDrag={() => onMapDrag()}
        showsCompass
        onRegionChange={(region) => {
          setUseSmallMarker(region.latitudeDelta > 0.15)
        }}
        loadingEnabled
      >
        <MapMarkers
          location={location}
          pointsOfInterest={pointsOfInterest}
          vehicles={vehicles}
          track={track}
          useSmallMarker={useSmallMarker}
        />
      </MapView>
      <View style={styles.bottomLayout}>
        {!isTripStarted ? (
          <Snackbar
            title="Fahrt starten"
            message={
              "Hier klicken um ein Fahrzeug auszuwälen und die Fahrt zu beginnen"
            }
            state={SnackbarState.INFO}
            onPress={() => {
              Platform.OS == "ios"
                ? Alert.prompt(
                    "Fahrzeugnummer",
                    "Geben Sie die Fahrzeugnummer ein um fortzufahren. Die Nummer kann in der Regel auf der Sitzbank gefunden werden.",
                    [
                      {
                        text: "Abbrechen",
                        onPress: () => console.log("Cancel Pressed"),
                      },
                      {
                        text: "Weiter",
                        onPress: (password) =>
                          console.log("OK Pressed, password: " + password),
                      },
                    ],
                    "plain-text"
                  )
                : setModalVisible(true)
            }}
          />
        ) : nextLevelCrossing < 100 ? (
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
        <LocationButton
          onPress={() => onLocationButtonClicked()}
          isActive={isFollowingUserState}
        />
      </View>
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
  bottomLayout: {
    position: "absolute",
    flex: 1,
    flexDirection: "column-reverse",
    bottom: 0,
    left: 0,
    right: 0,
  },
})
