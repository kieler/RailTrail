import { StyleSheet, View } from "react-native"
import { useKeepAwake } from "expo-keep-awake"
import MapView, { PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import React, { useEffect, useRef, useState } from "react"
import { Header } from "../components/header"
import {
  retrieveInitDataWithPosition,
  retrieveInitDataWithTrackId,
  retrieveUpdateDataInternalPosition,
} from "../effect-actions/api-actions"
import { InitResponse } from "../types/init"
import { Snackbar, SnackbarState } from "../components/snackbar"
import { setLocationListener } from "../effect-actions/location"
import { initialRegion, track } from "../util/consts"
import { LocationButton } from "../components/location-button"
import { UpdateResponseInternalPosition } from "../types/update"
import { MapMarkers } from "../components/map-markers"
import { StartTripBottomSheet } from "../components/start-trip-bottom-sheet"
import { useDispatch, useSelector } from "react-redux"
import { ReduxAppState } from "../redux/init"
import { TripAction } from "../redux/trip"
import { AppAction } from "../redux/app"
import { ChangeVehicleIdBottomSheet } from "../components/change-vehicle-id-bottom-sheet"

export const HomeScreen = () => {
  const mapRef: any = useRef(null)
  // Used to determine if the map should update
  const isFollowingUser = useRef<boolean>(true)
  // Used to set and update location icon
  const [isFollowingUserState, setIsFollowingUserState] =
    useState<boolean>(true)
  const [useSmallMarker, setUseSmallMarker] = useState<boolean>(false)

  const [isStartTripBottomSheetVisible, setIsStartTripBottomSheetVisible] =
    useState(false)
  const [
    isChangeVehicleIdBottomSheetVisible,
    setIsChangeVehicleIdBottomSheetVisible,
  ] = useState(false)

  useKeepAwake()

  const dispatch = useDispatch()

  const hasLocationPermission = useSelector(
    (state: ReduxAppState) => state.app.hasLocationPermission
  )
  const isTripStarted = useSelector(
    (state: ReduxAppState) => state.app.isTripStarted
  )
  const trackId = useSelector((state: ReduxAppState) => state.app.trackId)
  const location = useSelector((state: ReduxAppState) => state.app.location)
  const pointsOfInterest = useSelector(
    (state: ReduxAppState) => state.app.pointsOfInterest
  )

  const vehicleId = useSelector((state: ReduxAppState) => state.trip.vehicleId)
  const distanceTravelled = useSelector(
    (state: ReduxAppState) => state.trip.distanceTravelled
  )
  const speed = useSelector((state: ReduxAppState) => state.trip.speed)
  const nextVehicleDistance = useSelector(
    (state: ReduxAppState) => state.trip.nextVehicleDistance
  )
  const nextLevelCrossingDistance = useSelector(
    (state: ReduxAppState) => state.trip.nextLevelCrossingDistance
  )
  const vehicles = useSelector((state: ReduxAppState) => state.trip.vehicles)
  const percentagePositionOnTrack = useSelector(
    (state: ReduxAppState) => state.trip.percentagePositionOnTrack
  )

  useEffect(() => {
    if (hasLocationPermission) {
      retrieveInitDataWithPosition(setInitData)
      setLocationListener(handleLocationUpdate)
    } else {
      retrieveInitDataWithTrackId(trackId!, setInitData)
    }
  }, [])

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
    retrieveUpdateDataInternalPosition(setUpdateData, location, vehicleId!)
    setLocationVariables(location)
  }

  const setInitData = (initResponse: InitResponse) => {
    dispatch(AppAction.setPointsOfInterest(initResponse.pointsOfInterest))
    return {}
  }

  const setUpdateData = (updateResponse: UpdateResponseInternalPosition) => {
    dispatch(
      TripAction.setPercentagePositionOnTrack(
        updateResponse.percentagePositionOnTrack
      )
    )
    if (updateResponse.vehiclesNearUser)
      dispatch(TripAction.setVehicles(updateResponse.vehiclesNearUser))
    return {}
  }

  const setLocationVariables = (location: Location.LocationObject) => {
    dispatch(AppAction.setLocation(location))

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

    dispatch(TripAction.setSpeed((location.coords.speed ?? 0) * 3.6))
  }

  return (
    <View style={styles.container}>
      {isTripStarted ? (
        <Header
          distance={distanceTravelled}
          speed={speed}
          nextVehicle={nextVehicleDistance}
          nextCrossing={nextLevelCrossingDistance}
          vehicleId={vehicleId!!}
          setIsChangeVehicleIdBottomSheetVisible={
            setIsChangeVehicleIdBottomSheetVisible
          }
        />
      ) : null}
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
          location={location!}
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
              setIsStartTripBottomSheetVisible(true)
            }}
          />
        ) : nextLevelCrossingDistance && nextLevelCrossingDistance < 100 ? (
          <Snackbar
            title="Warnung"
            message={`Bahnübergang in ${nextLevelCrossingDistance}m`}
            state={SnackbarState.WARNING}
          />
        ) : nextVehicleDistance && nextVehicleDistance < 100 ? (
          <Snackbar
            title="Warnung"
            message={`Fahrzeug in ${nextVehicleDistance}m`}
            state={SnackbarState.WARNING}
          />
        ) : null}
        <LocationButton
          onPress={() => onLocationButtonClicked()}
          isActive={isFollowingUserState}
        />
      </View>
      <StartTripBottomSheet
        isVisible={isStartTripBottomSheetVisible}
        setIsVisible={setIsStartTripBottomSheetVisible}
        trackId={trackId}
      />
      <ChangeVehicleIdBottomSheet
        isVisible={isChangeVehicleIdBottomSheetVisible}
        setIsVisible={setIsChangeVehicleIdBottomSheetVisible}
        trackId={trackId}
      />
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
