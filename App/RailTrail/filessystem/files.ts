import * as FileSystem from "expo-file-system"
import * as Location from "expo-location"
import * as MediaLibrary from "expo-media-library"

const locationDir = FileSystem.documentDirectory + "train/"
const locationFileUri = (id: string) => locationDir + "locations.json" //`locations${id}.txt`

// Checks if gif directory exists. If not, creates it
async function ensureDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(locationDir)
  if (!dirInfo.exists) {
    console.log("Gif directory doesn't exist, creating...")
    await FileSystem.makeDirectoryAsync(locationDir, { intermediates: true })
  }
}

// Downloads all gifs specified as array of IDs
export async function addLocationToFilesystem(id: string, content: string) {
  try {
    await ensureDirExists()

    console.log(locationFileUri(id))

    await FileSystem.writeAsStringAsync(locationFileUri(id), content)
    // const asset = await MediaLibrary.createAssetAsync(locationFileUri(id))
    // await MediaLibrary.createAlbumAsync("Download", asset, false)
  } catch (e) {
    console.error("Couldn't download gif files:", e)
  }
}
