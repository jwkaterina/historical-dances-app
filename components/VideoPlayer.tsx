import { useState } from 'react'
import { View, StyleSheet, ViewStyle, useWindowDimensions, TouchableOpacity } from 'react-native'
import { Icon } from 'react-native-paper'
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
    return <UploadedVideoPlayer url={video.url} width={playerWidth} height={playerHeight} style={style} />
  }

  return null
}

function UploadedVideoPlayer({ url, width, height, style }: { url: string; width: number; height: number; style?: ViewStyle }) {
  const [playing, setPlaying] = useState(false)

  return (
    <View style={[styles.container, style]}>
      <Video
        source={{ uri: url }}
        style={{ width, height, borderRadius: 8 }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={playing}
        onPlaybackStatusUpdate={status => {
          if (!status.isLoaded) return
          if (status.didJustFinish) setPlaying(false)
        }}
      />
      {!playing && (
        <TouchableOpacity style={[styles.playOverlay, { width, height, borderRadius: 8 }]} onPress={() => setPlaying(true)} activeOpacity={0.8}>
          <View style={styles.playButton}>
            <Icon source="play" size={36} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
