import { View, StyleSheet, ViewStyle, useWindowDimensions, Linking } from 'react-native'
import { Button } from 'react-native-paper'
import YoutubeIframe from 'react-native-youtube-iframe'
import { Video, ResizeMode } from 'expo-av'
import type { DanceVideo, FigureVideo } from '@/types/database'

interface Props {
  video: DanceVideo | FigureVideo | { video_type: string; url: string }
  style?: ViewStyle
}

function getYouTubeId(url: string): string | null {
  // handle bare 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
  return match ? match[1] : null
}

export default function VideoPlayer({ video, style }: Props) {
  const { width } = useWindowDimensions()
  const playerWidth = width - 32
  const playerHeight = Math.round(playerWidth * 9 / 16)

  if (video.video_type === 'youtube') {
    const videoId = getYouTubeId(video.url)
    if (!videoId) return null
    return (
      <View style={[styles.container, style]}>
        <YoutubeIframe
          height={playerHeight}
          width={playerWidth}
          videoId={videoId}
          webViewProps={{ scrollEnabled: false }}
        />
      </View>
    )
  }

  // Uploaded video
  if (video.url) {
    return (
      <View style={[styles.container, style]}>
        <Video
          source={{ uri: video.url }}
          style={{ width: playerWidth, height: playerHeight, borderRadius: 8 }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
        />
      </View>
    )
  }

  return null
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
})
