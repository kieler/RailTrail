import React from "react"
import { Color } from "../values/color"
import * as Location from "expo-location"
import { PointOfInterest } from "../types/init"
import { Vehicle } from "../types/vehicle"
import { Marker, Geojson } from "react-native-maps"
import TrainForeground from "../assets/icons/train-forground"
import UserLocation from "../assets/icons/user-location"
import { PointOfInterestMarker } from "./point-of-interest-marker"
import TrainBackgroundHeading from "../assets/icons/train-background-heading"
import TrainBackgroundNeutral from "../assets/icons/train-background-neutral"

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
        <>
          <Marker
            key={index}
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={{
              latitude: vehicle.pos.lat,
              longitude: vehicle.pos.lng,
            }}
            zIndex={11}
          >
            {useSmallMarker ? (
              <TrainForeground width={15} height={18} />
            ) : (
              <TrainForeground />
            )}
          </Marker>
          <Marker
            key={-index}
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={{
              latitude: vehicle.pos.lat,
              longitude: vehicle.pos.lng,
            }}
            rotation={vehicle.heading}
            zIndex={10}
          >
            {useSmallMarker ? (
              vehicle.heading != null ? (
                <TrainBackgroundHeading width={32} height={32} />
              ) : (
                <TrainBackgroundNeutral width={32} height={32} />
              )
            ) : vehicle.heading != null ? (
              <TrainBackgroundHeading />
            ) : (
              <TrainBackgroundNeutral />
            )}
          </Marker>
        </>
      )
    })}
    <Geojson geojson={track} strokeColor={Color.track} strokeWidth={6} />
  </>
)
