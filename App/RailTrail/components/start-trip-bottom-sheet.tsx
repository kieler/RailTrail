import { StyleSheet, View, Text, Pressable, Alert } from "react-native"
import { textStyles } from "../values/text-styles"
import { Color } from "../values/color"
import { useEffect, useMemo, useRef, useState } from "react"
import BottomSheet, {
  BottomSheetTextInput,
  useBottomSheetDynamicSnapPoints,
} from "@gorhom/bottom-sheet"
import { Button } from "./button"
import { retrieveVehicleId } from "../effect-actions/api-actions"

interface ExternalProps {
  readonly isVisible: boolean
  readonly setIsVisible: React.Dispatch<React.SetStateAction<boolean>>
  readonly setVehicleId: React.Dispatch<React.SetStateAction<number>>
  readonly trackId: number
}

type Props = ExternalProps

export const StartTripBottomSheet = ({
  isVisible,
  setIsVisible,
  setVehicleId,
  trackId,
}: Props) => {
  const [text, onChangeText] = useState("")

  // ref
  const bottomSheetRef = useRef<BottomSheet>(null)

  // variables
  const snapPoints = useMemo(() => ["CONTENT_HEIGHT"], [])

  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints(snapPoints)

  useEffect(() => {
    if (isVisible) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isVisible])

  const onButtonPress = async () => {
    retrieveVehicleId(text, trackId).then((response) => {
      if (response == null) {
        Alert.alert(
          "Fahrzeug nicht gefunden",
          "Das Fahrzeug konnte nicht gefunden werden. Stellen Sie sicher dass die Fahrzeugnummer korrekt ist und die richtige Strecke ausgewählt ist.",
          [{ text: "OK", onPress: () => {} }]
        )
      } else {
        // Navigate back
        // Start trip
      }
    })
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
      enablePanDownToClose
      onClose={() => setIsVisible(false)}
    >
      <View style={styles.contentContainer} onLayout={handleContentLayout}>
        <Text style={[textStyles.headerTextBig, textStyles.textSpacing10]}>
          Fahrzeugnummer
        </Text>
        <Text>
          Geben Sie die Fahrzeugnummer ein um fortzufahren. Die Nummer kann in
          der Regel auf der Sitzbank gefunden werden.
        </Text>
        <BottomSheetTextInput
          placeholder="Fahrzeugnummer"
          value={text}
          onChangeText={onChangeText}
          style={styles.textInput}
        />
        <Button
          text={"Weiter"}
          onPress={() => onButtonPress()}
          style={styles.buttonMargin}
        />
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: "center",
  },
  textInput: {
    alignSelf: "stretch",
    margin: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Color.gray,
    textAlign: "center",
  },
  buttonMargin: { marginBottom: 10 },
})
