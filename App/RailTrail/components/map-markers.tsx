import { View, StyleSheet, Pressable } from "react-native"
import React from "react"
import { MaterialIcons } from "@expo/vector-icons"
import { Color } from "../values/color"
import * as Location from "expo-location"
import { PointOfInterest } from "../types/init"
import { Vehicle } from "../types/vehicle"
import { Marker, Geojson } from "react-native-maps"
import Train from "../assets/icons/train"
import UserLocation from "../assets/icons/user-location"
import { PointOfInterestMarker } from "./point-of-interest-marker"

interface ExternalProps {
  readonly location?: Location.LocationObject
  readonly pointsOfInterest: PointOfInterest[]
  readonly vehicles: Vehicle[]
  readonly track: GeoJSON.FeatureCollection
  readonly useSmallMarker: boolean
}

type Props = ExternalProps

export const MapMarkers = ({
  location,
  pointsOfInterest,
  vehicles,
  track,
  useSmallMarker,
}: Props) => (
  <>
    {location ? (
      <Marker
        key={0}
        zIndex={100}
        anchor={{ x: 0.5, y: 0.5 }}
        coordinate={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }}
      >
        <UserLocation />
      </Marker>
    ) : null}
    {pointsOfInterest.map((poi, index) => {
      return (
        <Marker
          key={index}
          anchor={{ x: 0.5, y: 0.5 }}
          coordinate={{
            latitude: poi.pos.lat,
            longitude: poi.pos.lng,
          }}
        >
          <PointOfInterestMarker
            pointOfInterestType={poi.type}
            useSmallMarker={useSmallMarker}
          />
        </Marker>
      )
    })}
    {vehicles.map((vehicle, index) => {
      return (
        <Marker
          key={index}
          anchor={{ x: 0.5, y: 0.5 }}
          coordinate={{
            latitude: vehicle.pos.lat,
            longitude: vehicle.pos.lng,
          }}
        >
          {useSmallMarker ? <Train width={32} height={32} /> : <Train />}
        </Marker>
      )
    })}
    <Geojson geojson={track} strokeColor={Color.track} strokeWidth={6} />
  </>
)
