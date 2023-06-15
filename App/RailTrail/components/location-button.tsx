import { View, StyleSheet, Pressable } from "react-native"
import React from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { Color } from "../values/color"

interface ExternalProps {
  readonly onLocationButtonClicked: () => void
  readonly isActive: boolean
}

type Props = ExternalProps

export const LocationButton = ({
  onLocationButtonClicked,
  isActive,
}: Props) => (
  <Pressable
    onPress={() => {
      onLocationButtonClicked()
    }}
  >
    <View style={styles.container}>
      {isActive ? (
        <MaterialIcons name="my-location" size={24} color={Color.primary} />
      ) : (
        <MaterialIcons
          name="location-searching"
          size={24}
          color={Color.black}
        />
      )}
    </View>
  </Pressable>
)

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-end",
    margin: 10,
    padding: 15,
    borderRadius: 15,
    backgroundColor: "white",
  },
})
