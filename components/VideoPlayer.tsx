import { StyleSheet, View, ViewStyle, Linking } from 'react-native'
import { Button } from 'react-native-paper'
import type { DanceVideo, FigureVideo } from '@/types/database'

interface Props {
  video: DanceVideo | FigureVideo
  style?: ViewStyle
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

export default function VideoPlayer({ video, style }: Props) {
  if (video.video_type === 'youtube') {
    const videoId = getYouTubeId(video.url)
    if (!videoId) return null

    return (
      <View style={[styles.container, style]}>
        <Button
          mode="outlined"
          icon="youtube"
          onPress={() => Linking.openURL(video.url)}
        >
          YouTube ansehen
        </Button>
      </View>
    )
  }

  // Uploaded video - open in browser (expo-av Video would need native module)
  return (
    <View style={[styles.container, style]}>
      <Button
        mode="outlined"
        icon="video"
        onPress={() => Linking.openURL(video.url)}
      >
        Video öffnen
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
})
