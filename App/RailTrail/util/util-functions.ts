export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const percentToDistance = (
  totalDistance: number,
  percentOfTrack: number
) => {
  return (totalDistance * percentOfTrack) / 100
}

// Code from https://www.movable-type.co.uk/scripts/latlong.html
export const calculateDistanceFromCoordinates = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) => {
  const R = 6371e3 // metres
  const φ1 = (lat1 * Math.PI) / 180 // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // in metres
}
