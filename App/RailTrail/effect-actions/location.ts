import * as Location from "expo-location"

export const getCurrentLocation = async () => {
  return await Location.getCurrentPositionAsync({})
}

export const setLocationListener = (
  callback: (location: Location.LocationObject) => {}
) => {
  Location.watchPositionAsync(
    {
      timeInterval: 0.1,
      distanceInterval: 0.1,
      accuracy: Location.LocationAccuracy.BestForNavigation,
    },
    callback
  )
}
