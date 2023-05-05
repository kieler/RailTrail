import { View, Text, StyleProp, ViewStyle, StyleSheet } from "react-native"
import React from "react"
import { Color } from "../values/color"

interface ExternalProps {
  readonly distance: number
  readonly speed: string
  readonly nextVehicle: number
  readonly nextCrossing: number
}

type Props = ExternalProps

export const Header = ({
  distance,
  speed,
  nextVehicle,
  nextCrossing,
}: Props) => (
  <View style={styles.container}>
    <View style={styles.row}>
      <View style={styles.box}>
        <Text style={styles.lable}>Distance</Text>
        <Text style={styles.value}>{distance} km</Text>
      </View>
      <View style={styles.box}>
        <Text style={styles.lable}>Next vehicle</Text>
        <Text style={styles.value}>{nextVehicle} m</Text>
      </View>
    </View>
    <View style={styles.row}>
      <View style={styles.box}>
        <Text style={styles.lable}>Speed</Text>
        <Text style={styles.value}>{speed} km/h</Text>
      </View>
      <View style={styles.box}>
        <Text style={styles.lable}>Next level crossing</Text>
        <Text style={styles.value}>{nextCrossing} m</Text>
      </View>
    </View>
  </View>
)

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
})
