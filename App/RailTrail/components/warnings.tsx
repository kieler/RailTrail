import { I18n } from "i18n-js"
import { Snackbar, SnackbarState } from "./snackbar"
import {
  LEVEL_CROSSING_WARNING_DISTANCE,
  VEHICLE_HEADING_TOWARDS_USER_WARNING_DISTANCE,
  VEHICLE_WARNING_DISTANCE,
} from "../util/consts"

interface ExternalProps {
  readonly localizedStrings: I18n
  readonly nextLevelCrossingDistance: number | null
  readonly nextVehicleDistance: number | null
  readonly nextVehicleHeadingTowardsUserDistance: number | null
}

type Props = ExternalProps

export const Warnings = ({
  localizedStrings,
  nextLevelCrossingDistance,
  nextVehicleDistance,
  nextVehicleHeadingTowardsUserDistance,
}: Props) => {
  const VehicleHeadingTowardsUserWarning = (
    <Snackbar
      title={localizedStrings.t("homeSnackbarWarningTitle")}
      message={localizedStrings.t(
        "homeSnackbarWarningVehicleHeadingTowardsUserMessage",
        {
          distance: Math.round(nextVehicleHeadingTowardsUserDistance!),
        }
      )}
      state={SnackbarState.WARNING}
    />
  )

  const VehicleWarning = (
    <Snackbar
      title={localizedStrings.t("homeSnackbarWarningTitle")}
      message={localizedStrings.t("homeSnackbarWarningVehicleMessage", {
        distance: Math.round(nextVehicleDistance!),
      })}
      state={SnackbarState.WARNING}
    />
  )

  const LevelCrossingWarning = (
    <Snackbar
      title={localizedStrings.t("homeSnackbarWarningTitle")}
      message={localizedStrings.t("homeSnackbarWarningCrossingMessage", {
        distance: Math.round(nextLevelCrossingDistance!),
      })}
      state={SnackbarState.WARNING}
    />
  )

  if (
    nextLevelCrossingDistance != null &&
    nextVehicleHeadingTowardsUserDistance != null
  ) {
    if (
      nextVehicleHeadingTowardsUserDistance <=
        VEHICLE_HEADING_TOWARDS_USER_WARNING_DISTANCE &&
      nextVehicleHeadingTowardsUserDistance <= nextLevelCrossingDistance
    ) {
      return VehicleHeadingTowardsUserWarning
    } else if (nextLevelCrossingDistance <= LEVEL_CROSSING_WARNING_DISTANCE) {
      return LevelCrossingWarning
    } else return null
  } else if (
    nextVehicleHeadingTowardsUserDistance != null &&
    nextVehicleHeadingTowardsUserDistance <=
      VEHICLE_HEADING_TOWARDS_USER_WARNING_DISTANCE
  ) {
    return VehicleHeadingTowardsUserWarning
  } else if (
    nextLevelCrossingDistance != null &&
    nextLevelCrossingDistance <= LEVEL_CROSSING_WARNING_DISTANCE
  ) {
    return LevelCrossingWarning
  } else if (
    nextVehicleDistance != null &&
    nextVehicleDistance <= VEHICLE_WARNING_DISTANCE
  ) {
    return VehicleWarning
  } else return null
}
