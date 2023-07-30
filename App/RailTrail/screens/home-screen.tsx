import { Alert, AppState, StyleSheet, View } from "react-native"
import { useKeepAwake } from "expo-keep-awake"
import MapView, { PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import React, { useEffect, useRef, useState } from "react"
import { Header } from "../components/header"
import {
  retrieveInitDataWithPosition,
  retrieveInitDataWithTrackId,
  retrieveUpdateData,
} from "../effect-actions/api-actions"
import { Snackbar, SnackbarState } from "../components/snackbar"
import {
  setBackgroundLocationListener,
  setForegroundLocationListener,
  stopBackgroundLocationListener,
  stopForegroundLocationListener,
} from "../effect-actions/location"
import {
  EXTERNAL_POSITION_UPDATE_INTERVALL,
  initialRegion,
  track,
} from "../util/consts"
import { LocationButton } from "../components/location-button"
import { MapMarkers } from "../components/map-markers"
import { StartTripBottomSheet } from "../components/start-trip-bottom-sheet"
import { useDispatch, useSelector } from "react-redux"
import { ReduxAppState } from "../redux/init"
import { AppAction } from "../redux/app"
import { ChangeVehicleIdBottomSheet } from "../components/change-vehicle-id-bottom-sheet"
import { useTranslation } from "../hooks/use-translation"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { FAB } from "../components/fab"
import { Color } from "../values/color"
import { updateDistances } from "../effect-actions/trip-actions"
import { requestBackgroundPermission } from "../effect-actions/permissions"
import { TripAction } from "../redux/trip"
import { Warnings } from "../components/warnings"

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

  const [oldPercentagePosition, setOldPercentagePosition] = useState<
    number | undefined
  >(undefined)

  const [isPercentagePositionIncreasing, setIsPercentagePositionIncreasing] =
    useState<boolean | undefined>(undefined)

  const appState = useRef(AppState.currentState)

  useKeepAwake()
  const localizedStrings = useTranslation()
  const dispatch = useDispatch()

  const hasForegroundLocationPermission = useSelector(
    (state: ReduxAppState) => state.app.hasForegroundLocationPermission
  )
  const hasBackgroundLocationPermission = useSelector(
    (state: ReduxAppState) => state.app.hasBackgroundLocationPermission
  )
  const isTripStarted = useSelector(
    (state: ReduxAppState) => state.app.isTripStarted
  )
  const trackId = useSelector((state: ReduxAppState) => state.app.trackId)
  const location = useSelector((state: ReduxAppState) => state.app.location)
  const pointsOfInterest = useSelector(
    (state: ReduxAppState) => state.app.pointsOfInterest
  )
  const foregroundLocationSubscription = useSelector(
    (state: ReduxAppState) => state.app.foregroundLocationSubscription
  )

  const vehicleId = useSelector((state: ReduxAppState) => state.trip.vehicleId)
  const trackLength = useSelector(
    (state: ReduxAppState) => state.trip.trackLength
  )
  const distanceTravelled = useSelector(
    (state: ReduxAppState) => state.trip.distanceTravelled
  )
  const speed = useSelector((state: ReduxAppState) => state.trip.speed)
  const heading = useSelector((state: ReduxAppState) => state.trip.heading)
  const calculatedPosition = useSelector(
    (state: ReduxAppState) => state.trip.calculatedPosition
  )
  const nextVehicleDistance = useSelector(
    (state: ReduxAppState) => state.trip.nextVehicleDistance
  )
  const nextVehicleHeadingTowardsUserDistance = useSelector(
    (state: ReduxAppState) => state.trip.nextVehicleHeadingTowardsUserDistance
  )
  const nextLevelCrossingDistance = useSelector(
    (state: ReduxAppState) => state.trip.nextLevelCrossingDistance
  )
  const vehicles = useSelector((state: ReduxAppState) => state.trip.vehicles)
  const percentagePositionOnTrack = useSelector(
    (state: ReduxAppState) => state.trip.percentagePositionOnTrack
  )

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        appState.current = nextAppState
      }
    )

    if (hasForegroundLocationPermission) {
      retrieveInitDataWithPosition(dispatch)
      setForegroundLocationListener(handleInternalLocationUpdate, dispatch)
    } else {
      retrieveInitDataWithTrackId(trackId!, dispatch)
    }

    return () => {
      appStateSubscription.remove()
    }
  }, [])

  useEffect(() => {
    if (isTripStarted && calculatedPosition) {
      animateCamera(calculatedPosition.lat, calculatedPosition.lng, heading)
    } else if (location) {
      animateCamera(
        location.coords.latitude,
        location.coords.longitude,
        location.coords.heading
      )
    }
  }, [location, calculatedPosition])

  useEffect(() => {
    if (isTripStarted && hasForegroundLocationPermission && location) {
      retrieveUpdateData(dispatch, vehicleId!, calculatedPosition, location)
    }
  }, [isTripStarted, location])

  useEffect(() => {
    if (!isTripStarted) {
      if (hasBackgroundLocationPermission) {
        stopBackgroundLocationListener()
        setForegroundLocationListener(handleInternalLocationUpdate, dispatch)
      }
      return
    }
    // TODO: Ask for notification permission

    if (hasForegroundLocationPermission) {
      if (!hasBackgroundLocationPermission) {
        Alert.alert(
          localizedStrings.t("homeDialogBackgroundPermissionTripTitle"),
          localizedStrings.t("homeDialogBackgroundPermissionMessage"),
          [
            {
              text: localizedStrings.t("alertOk"),
              onPress: () => {
                requestBackgroundPermission().then((result) => {
                  if (result) {
                    dispatch(AppAction.setHasBackgroundLocationPermission(true))

                    stopForegroundLocationListener(
                      foregroundLocationSubscription
                    )
                    setBackgroundLocationListener(handleInternalLocationUpdate)
                  }
                })
              },
            },
          ]
        )
      } else {
        stopForegroundLocationListener(foregroundLocationSubscription)
        setBackgroundLocationListener(handleInternalLocationUpdate)
      }
      return
    }

    retrieveUpdateData(dispatch, vehicleId!, calculatedPosition)

    const interval = setInterval(() => {
      if (appState.current == "active")
        retrieveUpdateData(dispatch, vehicleId!, calculatedPosition)
    }, EXTERNAL_POSITION_UPDATE_INTERVALL)

    return () => clearInterval(interval)
  }, [isTripStarted])

  useEffect(() => {
    if (percentagePositionOnTrack != null) {
      if (
        oldPercentagePosition != undefined &&
        oldPercentagePosition !== percentagePositionOnTrack
      )
        setIsPercentagePositionIncreasing(
          percentagePositionOnTrack > oldPercentagePosition
        )
      setOldPercentagePosition(percentagePositionOnTrack)

      if (isTripStarted) {
        updateDistances(
          dispatch,
          trackLength,
          percentagePositionOnTrack,
          pointsOfInterest,
          vehicles,
          isPercentagePositionIncreasing
        )
      }
    }
  }, [percentagePositionOnTrack])

  const handleInternalLocationUpdate = async (
    location: Location.LocationObject
  ) => {
    dispatch(AppAction.setLocation(location))
  }

  const onLocationButtonClicked = () => {
    isFollowingUser.current = !isFollowingUser.current
    setIsFollowingUserState(isFollowingUser.current)
    if (isFollowingUser.current && location)
      animateCamera(
        location.coords.latitude,
        location.coords.longitude,
        location.coords.heading
      )
    else if (isFollowingUser.current && calculatedPosition)
      animateCamera(calculatedPosition.lat, calculatedPosition.lng, heading)
  }

  const onMapDrag = () => {
    if (isFollowingUser.current) {
      isFollowingUser.current = false
      setIsFollowingUserState(false)
    }
  }

  const onTripStopClicked = () => {
    Alert.alert(
      localizedStrings.t("homeDialogEndTripTitle"),
      localizedStrings.t("homeDialogEndTripMessage"),
      [
        {
          text: localizedStrings.t("alertNo"),
          onPress: () => {},
        },
        {
          text: localizedStrings.t("alertYes"),
          onPress: () => {
            dispatch(AppAction.setIsTripStarted(false))
            dispatch(TripAction.reset())
          },
        },
      ]
    )
  }

  const animateCamera = (lat: number, lng: number, heading: number | null) => {
    if (mapRef && mapRef.current && isFollowingUser.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: lat,
            longitude: lng,
          },
          heading: heading,
        },
        { duration: 250 }
      )
    }
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
          location={location}
          calculatedPosition={calculatedPosition}
          pointsOfInterest={pointsOfInterest}
          vehicles={vehicles}
          track={track}
          useSmallMarker={useSmallMarker}
        />
      </MapView>
      <View style={styles.bottomLayout}>
        {isTripStarted ? (
          <Warnings
            localizedStrings={localizedStrings}
            nextLevelCrossingDistance={nextLevelCrossingDistance}
            nextVehicleDistance={nextVehicleDistance}
            nextVehicleHeadingTowardsUserDistance={
              nextVehicleHeadingTowardsUserDistance
            }
          />
        ) : (
          <Snackbar
            title={localizedStrings.t("homeSnackbarStartTitle")}
            message={localizedStrings.t("homeSnackbarStartMessage")}
            state={SnackbarState.INFO}
            onPress={() => {
              setIsStartTripBottomSheetVisible(true)
            }}
          />
        )}
        <LocationButton
          onPress={() => onLocationButtonClicked()}
          isActive={isFollowingUserState}
        />
        {isTripStarted ? (
          <FAB onPress={() => onTripStopClicked()}>
            <MaterialCommunityIcons
              name="stop-circle"
              size={30}
              color={Color.warning}
            />
          </FAB>
        ) : null}
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
