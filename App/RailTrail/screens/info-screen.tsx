import { StyleSheet, Dimensions, ScrollView, Text } from "react-native"
import { View } from "react-native"
import YoutubePlayer from "react-native-youtube-iframe"
import { textStyles } from "../values/text-styles"
import { Color } from "../values/color"
import { useTranslation } from "../hooks/use-translation"

export const InfoScreen = () => {
  const windowWidth = Dimensions.get("window").width - 20
  const youtubePlayerHeight = (windowWidth / 16) * 9
  const localizedStrings = useTranslation()

  return (
    <ScrollView style={styles.container} nestedScrollEnabled={false}>
      <Text
        style={[
          textStyles.headerTextBig,
          textStyles.textSpacing5,
          styles.textMargin,
        ]}
      >
        {localizedStrings.t("infoDraisineEquipment")}
      </Text>
      <View style={styles.youtubePlayerStyle}>
        <YoutubePlayer
          height={youtubePlayerHeight}
          videoId={"nt2UC_P2qt0"}
          mute
          webViewProps={{ overScrollMode: "never" }}
          webViewStyle={{ flex: 1 }}
        />
      </View>

      <Text style={[textStyles.headerTextBig, textStyles.textSpacing5]}>
        {localizedStrings.t("infoDraisineRules")}
      </Text>
      <View style={styles.youtubePlayerStyle}>
        <YoutubePlayer
          height={youtubePlayerHeight}
          videoId={"Y_b3CLVxdr4"}
          mute
          webViewProps={{ overScrollMode: "never" }}
          webViewStyle={{ borderRadius: 20 }}
        />
      </View>
      <Text style={[textStyles.headerTextBig, textStyles.textSpacing5]}>
        {localizedStrings.t("infoDraisineTurning")}
      </Text>
      <View style={styles.youtubePlayerStyle}>
        <YoutubePlayer
          height={youtubePlayerHeight}
          videoId={"hUnVDZjz-_o"}
          mute
          webViewProps={{ overScrollMode: "never" }}
          webViewStyle={{ borderRadius: 20 }}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.backgroundLight,
    width: "100%",
    paddingHorizontal: 10,
  },
  youtubePlayerStyle: {
    overflow: "hidden",
    flex: 1,
    borderRadius: 20,
    marginBottom: 15,
  },
  textMargin: { marginTop: 5 },
})
