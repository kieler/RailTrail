import * as Location from "expo-location"

export const getPermissions = async (setPermissions: any) => {
  let { status } = await Location.requestForegroundPermissionsAsync()
  if (status !== "granted") {
    setPermissions(false)
    return false
  } else {
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
