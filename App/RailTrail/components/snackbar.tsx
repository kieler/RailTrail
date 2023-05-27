import { Platform, StyleSheet, View, Text, AppState } from "react-native"
import { textStyles } from "../values/text-styles"
import { Color } from "../values/color"

interface ExternalProps {
  readonly title: string
  readonly message: string
  readonly state: SnackbarState
}

type Props = ExternalProps

export const Snackbar = ({ title, message, state }: Props) => {
  return (
    <View
      style={[
        styles.container,
        state == SnackbarState.WARNING
          ? styles.backgroundWarning
          : styles.backgroundWarning,
      ]}
    >
      <Text
        style={[
          textStyles.headerTextNormal,
          textStyles.textSpacing3,
          state == SnackbarState.WARNING
            ? textStyles.textLigth
            : textStyles.textLigth,
        ]}
      >
        {title}
      </Text>
      <Text
        style={
          state == SnackbarState.WARNING
            ? textStyles.textLigth
            : textStyles.textLigth
        }
      >
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flex: 1,
    margin: 10,
    padding: 15,
    borderRadius: 15,
  },
  backgroundWarning: {
    backgroundColor: Color.warning,
  },
})

export enum SnackbarState {
  WARNING,
  INFO,
}
