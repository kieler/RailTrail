import { StyleSheet, Text, FlatList, Pressable } from "react-native"
import { View } from "react-native"
import { textStyles } from "../values/text-styles"
import { Color } from "../values/color"
import { Button } from "../components/button"
import { useEffect, useState } from "react"
import { TrackListEntry } from "../types/init"
import { useDispatch } from "react-redux"
import { AppAction } from "../redux/app"
import { useTranslation } from "../hooks/use-translation"

export const TrackSelectionScreen = ({ navigation }: any) => {
  const [trackList, setTrackList] = useState<TrackListEntry[]>([])
  const [selectedTrack, setSelectedTrack] = useState<TrackListEntry | null>(
    null
  )

  const dispatch = useDispatch()
  const localizedStrings = useTranslation()

  useEffect(() => {
    //retrieveTracks(setTrackList)
    const track1: TrackListEntry = {
      id: 0,
      name: "Malente - Lütjenburg",
    }
    const track2: TrackListEntry = {
      id: 1,
      name: "Malente - Lütjenburg",
    }
    const track3: TrackListEntry = {
      id: 2,
      name: "Malente - Lütjenburg",
    }
    const track4: TrackListEntry = {
      id: 3,
      name: "Malente - Lütjenburg",
    }
    setTrackList([track1, track2, track3, track4])
  }, [])

  type ItemProps = { track: TrackListEntry; selected: boolean }
  const Item = ({ track, selected }: ItemProps) => (
    <Pressable
      onPress={() => {
        setSelectedTrack(track)
      }}
    >
      <View style={selected ? styles.itemSelected : styles.item}>
        <Text style={[textStyles.itemText]}>{track.name}</Text>
      </View>
    </Pressable>
  )

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text
          style={[
            textStyles.headerTextHuge,
            textStyles.textAlignmentCenter,
            textStyles.textSpacing10,
          ]}
        >
          {localizedStrings.t("trackSelectionTitle")}
        </Text>
        <Text
          style={[textStyles.textSpacing10, textStyles.textAlignmentCenter]}
        >
          {localizedStrings.t("trackSelectionDescription")}
        </Text>
      </View>
      <FlatList
        style={styles.listContainer}
        data={trackList}
        renderItem={({ item }) => (
          <Item track={item} selected={item == selectedTrack} />
        )}
      />
      <Button
        style={styles.button}
        text={localizedStrings.t("buttonContinue")}
        onPress={() => {
          if (selectedTrack != null) {
            dispatch(AppAction.setTrackId(selectedTrack.id))
            navigation.navigate("Main")
          }
        }}
        disabled={selectedTrack == null}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.backgroundLight,
    paddingVertical: 20,
  },
  textContainer: {
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  button: {
    paddingHorizontal: 20,
  },
  item: {
    marginVertical: 5,
    padding: 10,
    borderColor: Color.darkGray,
    borderWidth: 2,
    borderRadius: 10,
  },
  itemSelected: {
    marginVertical: 5,
    padding: 10,
    borderColor: Color.primary,
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: Color.gray,
  },
})
