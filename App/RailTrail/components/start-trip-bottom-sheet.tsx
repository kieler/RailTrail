import { StyleSheet, View, Text, Alert } from "react-native"
import { textStyles } from "../values/text-styles"
import { Color } from "../values/color"
import { useEffect, useMemo, useRef, useState } from "react"
import BottomSheet, {
  BottomSheetTextInput,
  useBottomSheetDynamicSnapPoints,
} from "@gorhom/bottom-sheet"
import { Button } from "./button"
import { retrieveVehicleId } from "../effect-actions/api-actions"
import { useDispatch } from "react-redux"
import { AppAction } from "../redux/app"
import { TripAction } from "../redux/trip"

interface ExternalProps {
  readonly isVisible: boolean
  readonly setIsVisible: React.Dispatch<React.SetStateAction<boolean>>
  readonly trackId: number | null
}

type Props = ExternalProps

export const StartTripBottomSheet = ({
  isVisible,
  setIsVisible,
  trackId,
}: Props) => {
  const dispatch = useDispatch()

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
    retrieveVehicleId(text, trackId!).then((response) => {
      if (response == null) {
        Alert.alert(
          "Fahrzeug nicht gefunden",
          "Das Fahrzeug konnte nicht gefunden werden. Stellen Sie sicher dass die Fahrzeugnummer korrekt ist und die richtige Strecke ausgewählt ist.",
          [{ text: "OK", onPress: () => {} }]
        )
      } else {
        dispatch(TripAction.setVehicleId(parseInt(text)))
        dispatch(AppAction.setIsTripStarted(true))
        setIsVisible(false)
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
