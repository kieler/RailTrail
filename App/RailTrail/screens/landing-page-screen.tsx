import { StyleSheet, Dimensions, ScrollView, Text } from "react-native"
import { View, Alert } from "react-native"
import YoutubePlayer from "react-native-youtube-iframe"
import { textStyles } from "../values/text-styles"
import { Color } from "../values/color"
import { Button } from "../components/button"

export const LandingPageScreen = ({ navigation }: any) => {
  //

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
        onPress={() => {}}
        isSecondary
        style={styles.buttonMargin}
      />
      <Button
        text={"Weiter mit Standortdaten"}
        onPress={() => {
          navigation.navigate("Main")
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
