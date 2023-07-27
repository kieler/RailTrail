export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const percentToDistance = (
  totalDistance: number,
  percentOfTrack: number
) => {
  return (totalDistance * percentOfTrack) / 100
}
