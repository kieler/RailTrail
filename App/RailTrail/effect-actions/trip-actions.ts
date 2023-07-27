import { Dispatch } from "redux"
import { POIType, PointOfInterest } from "../types/init"
import { TripAction } from "../redux/trip"
import { percentToDistance } from "../util/util-functions"
import { Vehicle } from "../types/vehicle"

export const updateDistances = (
  dispatch: Dispatch,
  trackLength: number | null,
  percentagePositionOnTrack: number | null,
  pointsOfInterest: PointOfInterest[],
  vehicles: Vehicle[],
  isPercentagePositionIncreasing?: boolean
) => {
  const nextLevelCrossing = getNextPOI(
    percentagePositionOnTrack,
    pointsOfInterest,
    POIType.LevelCrossing,
    isPercentagePositionIncreasing
  )
  if (nextLevelCrossing && percentagePositionOnTrack && trackLength) {
    const percentageDif = Math.abs(
      nextLevelCrossing.percentagePosition - percentagePositionOnTrack
    )

    dispatch(
      TripAction.setNextLevelCrossingDistance(
        percentToDistance(trackLength, percentageDif)
      )
    )
  }

  const nextVehicle = getNextVehicle(
    percentagePositionOnTrack,
    vehicles,
    isPercentagePositionIncreasing
  )
  if (nextVehicle && percentagePositionOnTrack && trackLength) {
    const percentageDif = Math.abs(
      nextVehicle.percentagePosition - percentagePositionOnTrack
    )

    dispatch(
      TripAction.setNextVehicleDistance(
        percentToDistance(trackLength, percentageDif)
      )
    )
  }
}

const getNextPOI = (
  percentagePositionOnTrack: number | null,
  pointsOfInterest: PointOfInterest[],
  type: POIType,
  isPercentagePositionIncreasing?: boolean
) => {
  if (percentagePositionOnTrack == null) return null

  const filteredPOIs = pointsOfInterest
    .filter((poi) => poi.type == type)
    .filter((poi) =>
      isPercentagePositionIncreasing
        ? poi.percentagePosition >= percentagePositionOnTrack
        : poi.percentagePosition <= percentagePositionOnTrack
    )

  return filteredPOIs.reduce(
    (oldValue: PointOfInterest | null, currentValue) => {
      if (!oldValue) return currentValue
      if (
        (isPercentagePositionIncreasing &&
          currentValue.percentagePosition <= oldValue.percentagePosition) ||
        (!isPercentagePositionIncreasing &&
          currentValue.percentagePosition >= oldValue.percentagePosition)
      )
        return currentValue
      else return oldValue
    },
    null
  )
}

const getNextVehicle = (
  percentagePositionOnTrack: number | null,
  vehicles: Vehicle[],
  isPercentagePositionIncreasing?: boolean
) => {
  if (percentagePositionOnTrack == null) return null

  const filteredVehicles = isPercentagePositionIncreasing
    ? vehicles.filter(
        (vehicle) => vehicle.percentagePosition >= percentagePositionOnTrack
      )
    : vehicles.filter(
        (vehicle) => vehicle.percentagePosition <= percentagePositionOnTrack
      )

  return filteredVehicles.reduce((oldValue: Vehicle | null, currentValue) => {
    if (!oldValue) return currentValue
    if (
      (isPercentagePositionIncreasing &&
        currentValue.percentagePosition <= oldValue.percentagePosition) ||
      (!isPercentagePositionIncreasing &&
        currentValue.percentagePosition >= oldValue.percentagePosition)
    )
      return currentValue
    else return oldValue
  }, null)
}
