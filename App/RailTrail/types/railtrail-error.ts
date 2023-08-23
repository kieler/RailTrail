export enum RailTrailErrorType {
  NoInitData,
  NoUpdateData,
  UnknownError,
}

export interface RailTrailError {
  readonly type: RailTrailErrorType
  readonly title: string
  readonly message: string
}

const noInitData = (): RailTrailError => ({
  type: RailTrailErrorType.NoInitData,
  title: "errorNoInitDataTitle",
  message: "errorNoInitDataMessage",
})

const noUpdateData = (): RailTrailError => ({
  type: RailTrailErrorType.NoUpdateData,
  title: "errorNoUpdateDataTitle",
  message: "errorNoUpdateDataMessage",
})

const unknownError = (message?: string): RailTrailError => ({
  type: RailTrailErrorType.UnknownError,
  title: "errorUnknownErrorTitle",
  message: "errorUnknownErrorMessage" + (message ? ` (${message})` : ""),
})

export const RailTrailError = {
  noInitData,
  noUpdateData,
  unknownError,
}

export const isRailTrailError = (e: any): e is RailTrailError => {
  if (!e) {
    return false
  }

  const error = e as RailTrailError

  return (
    typeof error.message === "string" &&
    typeof error.title === "string" &&
    error.type in RailTrailErrorType
  )
}
