import * as Location from "expo-location"
import { delay } from "../util/util-functions"

export const getCurrentLocation = async () => {
  return await Location.getCurrentPositionAsync({})
}

export const setLocationListener = async (
  callback: (location: Location.LocationObject) => {}
) => {
  await delay(500) // Wait for the map to set initial region
  Location.watchPositionAsync(
    {
      timeInterval: 0.1,
      distanceInterval: 0.1,
      accuracy: Location.LocationAccuracy.BestForNavigation,
    },
    callback
  )
}
