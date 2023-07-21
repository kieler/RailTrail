import { StyleSheet, Text } from "react-native"
import { View } from "react-native"
import { textStyles } from "../values/text-styles"
import { Color } from "../values/color"
import { Button } from "../components/button"
import { useEffect, useState } from "react"
import {
  getPermissionStatus,
  getPermissions,
} from "../effect-actions/permissions"
import { useDispatch } from "react-redux"
import { AppAction } from "../redux/app"

export const LandingPageScreen = ({ navigation }: any) => {
  const [permissions, setPermissions] = useState<Boolean>(false)

  const dispatch = useDispatch()

  useEffect(() => {
    getPermissionStatus().then((isPermissionGrated) => {
      if (isPermissionGrated) {
        dispatch(AppAction.setHasLocationPermission(true))
        navigation.navigate("Main", {
          hasLocationPermission: true,
        })
      }
    })
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text
          style={[
            textStyles.headerTextHuge,
            textStyles.textAlignmentCenter,
            textStyles.textSpacing10,
          ]}
        >
          Willkommen bei RailTrail
        </Text>
        <Text
          style={[textStyles.textSpacing10, textStyles.textAlignmentCenter]}
        >
          Mit RailTrail bist du auf der Schiene sicher unterwegs und bekommst
          viele nützliche Informationen angezeigt.
        </Text>
        <Text style={textStyles.textAlignmentCenter}>
          Um RailTrail im vollen Funktionsumfang nutzen zu können, empfehlen wir
          dir die Standortdaten für die App zu aktivieren.
        </Text>
      </View>
      <Button
        text={"Weiter ohne Standortdaten"}
        onPress={() => {
          navigation.navigate("Track Selection")
        }}
        isSecondary
        style={styles.buttonMargin}
      />
      <Button
        text={"Weiter mit Standortdaten"}
        onPress={() => {
          getPermissions(setPermissions).then((result) => {
            if (result) {
              dispatch(AppAction.setHasLocationPermission(true))
              navigation.navigate("Main", {
                hasLocationPermission: true,
              })
            } else {
              navigation.navigate("Track Selection")
            }
          })
        }}
        style={styles.buttonMargin}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.backgroundLight,
    padding: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  buttonMargin: { marginBottom: 10 },
})
