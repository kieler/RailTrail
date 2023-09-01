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
import { Position } from "../types/position"
import PassingPosition from "../assets/icons/passing-position"

interface ExternalProps {
  readonly location: Location.LocationObject | null
  readonly calculatedPosition: Position | null
  readonly pointsOfInterest: PointOfInterest[]
  readonly vehicles: Vehicle[]
  readonly passingPosition: Position | null
  readonly track: GeoJSON.FeatureCollection | null
  readonly useSmallMarker: boolean
  readonly mapHeading: number
}

type Props = ExternalProps

export const MapMarkers = ({
  location,
  calculatedPosition,
  pointsOfInterest,
  vehicles,
  passingPosition,
  track,
  useSmallMarker,
  mapHeading,
}: Props) => {
  return (
    <>
      {calculatedPosition ? (
        <Marker
          key={0}
          zIndex={100000}
          anchor={{ x: 0.5, y: 0.5 }}
          coordinate={{
            latitude: calculatedPosition.lat,
            longitude: calculatedPosition.lng,
          }}
        >
          <UserLocation />
        </Marker>
      ) : location ? (
        <Marker
          key={0}
          zIndex={100000}
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
              pointOfInterestType={poi.typeId}
              useSmallMarker={useSmallMarker}
            />
          </Marker>
        )
      })}
      {vehicles.map((vehicle, index) => {
        return (
          <Marker
            key={"foreground" + vehicle.id}
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={{
              latitude: vehicle.pos.lat,
              longitude: vehicle.pos.lng,
            }}
            zIndex={11 + index}
          >
            {useSmallMarker ? (
              <TrainForeground width={15} height={18} />
            ) : (
              <TrainForeground />
            )}
          </Marker>
        )
      })}
      {vehicles.map((vehicle, index) => {
        return (
          <Marker
            key={"background" + vehicle.id}
            anchor={{ x: 0.5, y: 0.5 }}
            coordinate={{
              latitude: vehicle.pos.lat,
              longitude: vehicle.pos.lng,
            }}
            rotation={
              vehicle.heading != undefined
                ? vehicle.heading - mapHeading
                : undefined
            }
            zIndex={10 + index}
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
        )
      })}
      {passingPosition ? (
        <Marker
          key={1}
          zIndex={10}
          anchor={{ x: 0.5, y: 0.5 }}
          coordinate={{
            latitude: passingPosition.lat,
            longitude: passingPosition.lng,
          }}
        >
          {useSmallMarker ? (
            <PassingPosition width={32} height={32} />
          ) : (
            <PassingPosition />
          )}
        </Marker>
      ) : null}
      {track ? (
        <Geojson geojson={track} strokeColor={Color.track} strokeWidth={6} />
      ) : null}
    </>
  )
}
