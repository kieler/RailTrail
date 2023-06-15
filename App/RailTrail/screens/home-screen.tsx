import { StyleSheet, View, AppState } from "react-native"
import { useKeepAwake } from "expo-keep-awake"
import MapView, { Geojson, Marker, PROVIDER_GOOGLE } from "react-native-maps"
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
import { initialRegion, track } from "../util/consts"
import TrackEnd from "../assets/icons/track-end"
import Picnic from "../assets/icons/picnic"
import { Color } from "../values/color"
import { LocationButton } from "../components/location-button"

export const HomeScreen = () => {
  const [permissions, setPermissions] = useState<Boolean>(false)
  const [location, setLocation] = useState<Location.LocationObject>()

  const mapRef: any = useRef(null)
  // Used to determine if the map should update
  const isFollowingUser = useRef<boolean>(true)
  // Used to set and update location icon
  const [isFollowingUserState, setIsFollowingUserState] =
    useState<boolean>(true)

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
    retrieveUpdateData(setUpdateData, location, vehicleId)
    setLocationVariables(location)
  }

  const setInitData = (initResponse: InitResponse) => {
    setPointsOfInterest(initResponse.pointsOfInterest)
    return {}
  }

  const setUpdateData = (updateResponse: UpdateResponse) => {
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
        showsUserLocation
        showsMyLocationButton={false}
        onPanDrag={() => onMapDrag()}
        showsCompass
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
        <Geojson geojson={track} strokeColor={Color.track} strokeWidth={6} />
        {/* {location ? (
          <Marker
            key={0}
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
          >
            <Picnic />
          </Marker>
        ) : null} */}
      </MapView>
      <View style={styles.bottomLayout}>
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
        <LocationButton
          onLocationButtonClicked={() => onLocationButtonClicked()}
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
