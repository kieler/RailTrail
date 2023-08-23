import { StyleSheet, View, Text, Alert, Keyboard } from "react-native"
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
import { TripAction } from "../redux/trip"
import { useTranslation } from "../hooks/use-translation"

interface ExternalProps {
  readonly isVisible: boolean
  readonly setIsVisible: React.Dispatch<React.SetStateAction<boolean>>
  readonly trackId: number | null
}

type Props = ExternalProps

export const ChangeVehicleIdBottomSheet = ({
  isVisible,
  setIsVisible,
  trackId,
}: Props) => {
  const dispatch = useDispatch()
  const localizedStrings = useTranslation()

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
          localizedStrings.t("bottomSheetAlertVehicleIdNotFoundTitle"),
          localizedStrings.t("bottomSheetAlertVehicleIdNotFoundMessage"),
          [{ text: localizedStrings.t("alertOk"), onPress: () => {} }]
        )
      } else {
        setIsVisible(false)
        Keyboard.dismiss()
        dispatch(TripAction.setVehicleId(parseInt(text)))
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
          {localizedStrings.t("bottomSheetVehicleId")}
        </Text>
        <Text>{localizedStrings.t("bottomSheetChangeVehicleId")}</Text>
        <BottomSheetTextInput
          placeholder={localizedStrings.t("bottomSheetVehicleId")}
          value={text}
          autoCapitalize="none"
          onChangeText={onChangeText}
          style={styles.textInput}
        />
        <Button
          text={localizedStrings.t("buttonContinue")}
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
    marginHorizontal: 10,
  },
  textInput: {
    alignSelf: "stretch",
    marginVertical: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Color.gray,
    textAlign: "center",
  },
  buttonMargin: { marginBottom: 10 },
})
