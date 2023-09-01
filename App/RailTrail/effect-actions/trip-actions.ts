import { Dispatch } from "redux"
import { POIType, PointOfInterest } from "../types/init"
import { TripAction } from "../redux/trip"
import { percentToDistance } from "../util/util-functions"
import { Vehicle } from "../types/vehicle"

export const updateDistances = (
  dispatch: Dispatch,
  trackLength: number | null,
  percentagePositionOnTrack: number | null,
  lastPercentagePositionOnTrack: number | null,
  pointsOfInterest: PointOfInterest[],
  vehicles: Vehicle[],
  isPercentagePositionIncreasing?: boolean
) => {
  if (
    lastPercentagePositionOnTrack &&
    percentagePositionOnTrack &&
    trackLength
  ) {
    const percentageDif = Math.abs(
      percentagePositionOnTrack - lastPercentagePositionOnTrack
    )

    dispatch(
      TripAction.addToDistanceTravelled(
        percentToDistance(trackLength, percentageDif)
      )
    )
  }

  dispatch(
    TripAction.setLastPercentagePositionOnTrack(percentagePositionOnTrack)
  )

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
  } else {
    dispatch(TripAction.setNextLevelCrossingDistance(null))
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
  } else {
    dispatch(TripAction.setNextVehicleDistance(null))
  }

  const nextVehicleHeadingTowardsUser = getNextVehicle(
    percentagePositionOnTrack,
    vehicles,
    isPercentagePositionIncreasing,
    true
  )

  if (
    nextVehicleHeadingTowardsUser &&
    percentagePositionOnTrack &&
    trackLength
  ) {
    const percentageDif = Math.abs(
      nextVehicleHeadingTowardsUser.percentagePosition -
        percentagePositionOnTrack
    )

    dispatch(
      TripAction.setNextVehicleHeadingTowardsUserDistance(
        percentToDistance(trackLength, percentageDif)
      )
    )
  } else {
    dispatch(TripAction.setNextVehicleHeadingTowardsUserDistance(null))
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
    .filter((poi) => poi.typeId == type)
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
  isPercentagePositionIncreasing?: boolean,
  isHeadingTowardsUser?: boolean
) => {
  if (percentagePositionOnTrack == null) return null

  let filteredVehicles = isPercentagePositionIncreasing
    ? vehicles.filter(
        (vehicle) => vehicle.percentagePosition >= percentagePositionOnTrack
      )
    : vehicles.filter(
        (vehicle) => vehicle.percentagePosition <= percentagePositionOnTrack
      )

  if (isHeadingTowardsUser != null)
    filteredVehicles = filteredVehicles.filter(
      (vehicle) => vehicle.headingTowardsUser === isHeadingTowardsUser
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
