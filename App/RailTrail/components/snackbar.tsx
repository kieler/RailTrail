import { StyleSheet, View, Text } from "react-native"
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
    marginHorizontal: 10,
    marginBottom: 10,
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
