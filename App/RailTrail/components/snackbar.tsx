import { StyleSheet, View, Text, Pressable } from "react-native"
import { textStyles } from "../values/text-styles"
import { Color } from "../values/color"

interface ExternalProps {
  readonly title: string
  readonly message: string
  readonly state: SnackbarState
  readonly onPress?: () => void
}

type Props = ExternalProps

export const Snackbar = ({
  title,
  message,
  state,
  onPress = () => {},
}: Props) => (
  <Pressable
    onPress={() => {
      onPress()
    }}
  >
    <View
      style={[
        styles.container,
        state == SnackbarState.WARNING
          ? styles.backgroundWarning
          : styles.backgroundInfo,
      ]}
    >
      <Text
        style={[
          textStyles.headerTextNormal,
          textStyles.textSpacing3,
          state == SnackbarState.WARNING
            ? textStyles.textLigth
            : textStyles.textAccent,
        ]}
      >
        {title}
      </Text>
      <Text
        style={
          state == SnackbarState.WARNING
            ? textStyles.textLigth
            : textStyles.textDark
        }
      >
        {message}
      </Text>
    </View>
  </Pressable>
)

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
  backgroundInfo: {
    backgroundColor: Color.backgroundLight,
  },
})

export enum SnackbarState {
  WARNING,
  INFO,
}
