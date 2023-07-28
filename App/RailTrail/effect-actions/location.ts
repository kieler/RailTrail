import * as Location from "expo-location"
import * as TaskManager from "expo-task-manager"
import { delay } from "../util/util-functions"
import {
  BACKGROUND_LOCATION_TASK,
  MIN_LOCATION_UPDATE_DISTANCE_INTERVAL,
  MIN_LOCATION_UPDATE_TIME_INTERVAL,
} from "../util/consts"
import { Dispatch } from "redux"
import { AppAction } from "../redux/app"

export const getCurrentLocation = async () => {
  return await Location.getCurrentPositionAsync({})
}

export const setForegroundLocationListener = async (
  callback: (location: Location.LocationObject) => {},
  dispatch: Dispatch
) => {
  await delay(500) // Wait for the map to set initial region
  dispatch(
    AppAction.setForegroundLocationSubscription(
      await Location.watchPositionAsync(
        {
          timeInterval: MIN_LOCATION_UPDATE_TIME_INTERVAL,
          distanceInterval: MIN_LOCATION_UPDATE_DISTANCE_INTERVAL,
          accuracy: Location.LocationAccuracy.BestForNavigation,
        },
        callback
      )
    )
  )
}

export const stopForegroundLocationListener = (
  subscriptionHandler: Location.LocationSubscription | null
) => {
  if (subscriptionHandler) subscriptionHandler.remove()
}

export const setBackgroundLocationListener = (
  callback: (location: Location.LocationObject) => {}
) => {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }: any) => {
    if (error) {
      console.log(error.message)
      return
    }

    callback(data.locations[0])
  })

  Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    timeInterval: MIN_LOCATION_UPDATE_TIME_INTERVAL,
    distanceInterval: MIN_LOCATION_UPDATE_DISTANCE_INTERVAL,
    accuracy: Location.LocationAccuracy.BestForNavigation,
  })
}

export const stopBackgroundLocationListener = async () => {
  if (TaskManager.isTaskDefined(BACKGROUND_LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
    TaskManager.unregisterAllTasksAsync()
  }
}
