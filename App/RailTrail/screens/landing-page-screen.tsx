import { StyleSheet, Text } from "react-native"
import { View } from "react-native"
import { textStyles } from "../values/text-styles"
import { Color } from "../values/color"
import { Button } from "../components/button"
import { useEffect, useState } from "react"
import {
  getForegroundPermissionStatus,
  requestForegroundPermission,
} from "../effect-actions/permissions"
import { useDispatch } from "react-redux"
import { AppAction } from "../redux/app"
import { useTranslation } from "../hooks/use-translation"

export const LandingPageScreen = ({ navigation }: any) => {
  const dispatch = useDispatch()
  const localizedStrings = useTranslation()

  useEffect(() => {
    getForegroundPermissionStatus().then((isPermissionGrated) => {
      if (isPermissionGrated) {
        dispatch(AppAction.setHasForegroundLocationPermission(true))
        navigation.navigate("Main")
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
            textStyles.textSpacing20,
          ]}
        >
          {localizedStrings.t("landingPageWelcome")}
        </Text>
        <Text
          style={[textStyles.textSpacing20, textStyles.textAlignmentCenter]}
        >
          {localizedStrings.t("landingPageDescription")}
        </Text>
        <Text style={textStyles.textAlignmentCenter}>
          {localizedStrings.t("landingPagePermissionExplanation")}
        </Text>
      </View>
      <Button
        text={localizedStrings.t("landingPageButtonWithoutLocation")}
        onPress={() => {
          navigation.navigate("Track Selection")
        }}
        isSecondary
        style={styles.buttonMargin}
      />
      <Button
        text={localizedStrings.t("landingPageButtonWithLocation")}
        onPress={() => {
          requestForegroundPermission().then((result) => {
            if (result) {
              dispatch(AppAction.setHasForegroundLocationPermission(true))

              navigation.navigate("Main")
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
