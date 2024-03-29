import { Alert, StyleSheet, View } from "react-native"
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
import {
  getBackgroundPermissionStatus,
  requestBackgroundPermission,
} from "../effect-actions/permissions"
import { TripAction } from "../redux/trip"
import { Warnings } from "../components/warnings"

export const HomeScreen = () => {
  const mapRef: any = useRef(null)
  const [cameraHeading, setCameraHeading] = useState<number>(0)
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

  const [isPercentagePositionIncreasing, setIsPercentagePositionIncreasing] =
    useState<boolean | undefined>(undefined)

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
  const trackPath = useSelector((state: ReduxAppState) => state.app.trackPath)
  const location = useSelector((state: ReduxAppState) => state.app.location)
  const pointsOfInterest = useSelector(
    (state: ReduxAppState) => state.app.pointsOfInterest
  )
  const foregroundLocationSubscription = useSelector(
    (state: ReduxAppState) => state.app.foregroundLocationSubscription
  )

  const vehicleId = useSelector((state: ReduxAppState) => state.trip.vehicleId)
  const vehicleName = useSelector(
    (state: ReduxAppState) => state.trip.vehicleName
  )
  const trackLength = useSelector(
    (state: ReduxAppState) => state.app.trackLength
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
  const lastPercentagePositionOnTrack = useSelector(
    (state: ReduxAppState) => state.trip.lastPercentagePositionOnTrack
  )
  const passingPosition = useSelector(
    (state: ReduxAppState) => state.trip.passingPositon
  )

  // Get init data from server.
  useEffect(() => {
    if (hasForegroundLocationPermission) {
      retrieveInitDataWithPosition(dispatch)
      setForegroundLocationListener(handleInternalLocationUpdate, dispatch)

      getBackgroundPermissionStatus().then((result) => {
        dispatch(AppAction.setHasBackgroundLocationPermission(result))
      })
    } else {
      retrieveInitDataWithTrackId(trackId!, dispatch)
    }
  }, [])

  // Call camera animation when location is updated
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

  // Get update data from server with internal position
  useEffect(() => {
    if (isTripStarted && hasForegroundLocationPermission && location) {
      retrieveUpdateData(dispatch, vehicleId!, location)
    }
  }, [isTripStarted, location])

  // Handles stuff that should be executed on trip start or trip end
  useEffect(() => {
    if (!isTripStarted) {
      // Background location tracking is only needed druring a trip
      if (hasBackgroundLocationPermission) {
        stopBackgroundLocationListener()
        setForegroundLocationListener(handleInternalLocationUpdate, dispatch)
      }
      return
    }

    if (hasForegroundLocationPermission) {
      // Switch from foreground to background location tracking if possible (because trip is started).
      if (!hasBackgroundLocationPermission) {
        // Inform about background location tracking
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

    // Initial update call to server, so we skip inital delap from setInterval
    retrieveUpdateData(dispatch, vehicleId!)

    // Interval that reguarly calls the server for updates. Only used if location tracking is disabled.
    const interval = setInterval(() => {
      retrieveUpdateData(dispatch, vehicleId!)
    }, EXTERNAL_POSITION_UPDATE_INTERVALL)

    return () => clearInterval(interval)
  }, [isTripStarted])

  // Calculates distances and in which direction on the track the user is moving
  useEffect(() => {
    if (percentagePositionOnTrack != null) {
      if (
        lastPercentagePositionOnTrack != undefined &&
        lastPercentagePositionOnTrack !== percentagePositionOnTrack
      )
        setIsPercentagePositionIncreasing(
          percentagePositionOnTrack > lastPercentagePositionOnTrack
        )

      if (isTripStarted) {
        updateDistances(
          dispatch,
          trackLength,
          percentagePositionOnTrack,
          lastPercentagePositionOnTrack,
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

  const updateCameraHeading = async () => {
    mapRef.current
      .getCamera()
      .then((camera: any) => setCameraHeading(camera.heading))
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
          vehicleName={vehicleName!!}
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
        onRegionChangeComplete={() => updateCameraHeading()}
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
          passingPosition={passingPosition}
          track={trackPath}
          useSmallMarker={useSmallMarker}
          mapHeading={cameraHeading}
        />
      </MapView>
      <View style={styles.bottomLayout} pointerEvents={"box-none"}>
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
