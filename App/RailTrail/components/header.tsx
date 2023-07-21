import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  StyleSheet,
  Pressable,
} from "react-native"
import React from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { Color } from "../values/color"

interface ExternalProps {
  readonly distance: number
  readonly speed: number
  readonly nextVehicle: number | null
  readonly nextCrossing: number | null
  readonly vehicleId: number
  readonly setIsChangeVehicleIdBottomSheetVisible: React.Dispatch<
    React.SetStateAction<boolean>
  >
}

type Props = ExternalProps

export const Header = ({
  distance,
  speed,
  nextVehicle,
  nextCrossing,
  vehicleId,
  setIsChangeVehicleIdBottomSheetVisible,
}: Props) => {
  speed = speed < 1 ? 0 : Math.round(speed)
  let speedString = speed < 1 ? "0" : speed.toString()
  let distanceString =
    distance < 1000 ? distance + "m" : Math.round(distance / 100) / 10 + "km"

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.box}>
          <Text style={styles.lable}>Distance</Text>
          <Text style={styles.value}>{distanceString}</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.lable}>Next vehicle</Text>
          <Text style={styles.value}>{nextVehicle} m</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.box}>
          <Text style={styles.lable}>Speed</Text>
          <Text style={styles.value}>{speedString ?? ""} km/h</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.lable}>Next level crossing</Text>
          <Text style={styles.value}>{nextCrossing ?? ""} m</Text>
        </View>
      </View>
      <Pressable
        onPress={() => {
          setIsChangeVehicleIdBottomSheetVisible(true)
        }}
      >
        <View style={styles.rowSingleLine}>
          <Text style={styles.lableSingleLine}>Vehicle ID:</Text>
          <Text style={styles.valueSingleLine}>{vehicleId ?? ""}</Text>
          <MaterialIcons
            style={styles.icon}
            name="cached"
            size={24}
            color="black"
          />
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Color.backgroundLight,
    width: "100%",
  },
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  box: {
    width: "50%",
    borderColor: Color.gray,
    borderWidth: 1,
  },
  lable: {
    margin: 10,
  },
  value: {
    marginStart: 10,
    marginBottom: 10,
    fontSize: 25,
  },
  rowSingleLine: {
    width: "100%",
    flexDirection: "row",
  },
  lableSingleLine: {
    margin: 10,
    fontSize: 16,
    alignSelf: "center",
  },
  valueSingleLine: {
    margin: 10,
    fontSize: 20,
  },
  icon: {
    alignSelf: "center",
  },
})
