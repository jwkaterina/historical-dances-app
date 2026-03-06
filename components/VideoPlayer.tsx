import { useState, useRef, useEffect } from 'react'
import { View, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native'
import { Icon, Text } from 'react-native-paper'
import YoutubeIframe from 'react-native-youtube-iframe'
import { Video, ResizeMode } from 'expo-av'
import { useIsFocused } from '@react-navigation/native'
import { useLanguage } from '@/contexts/LanguageContext'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
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

function VideoErrorPlaceholder({ width, height }: { width: number; height: number }) {
  const { t } = useLanguage()
  return (
    <View style={[styles.errorBox, { width, height }]}>
      <Icon source="video-off-outline" size={32} color={Colors.mutedForeground} />
      <Text style={styles.errorText}>{t('videoLoadError')}</Text>
    </View>
  )
}

export default function VideoPlayer({ video, style }: Props) {
  const { width } = useWindowDimensions()
  const playerWidth = width - 32
  const playerHeight = Math.round(playerWidth * 9 / 16)

  if (video.video_type === 'youtube') {
    const videoId = getYouTubeId(video.url)
    if (!videoId) return null
    return (
      <YoutubePlayerWithError videoId={videoId} playerWidth={playerWidth} playerHeight={playerHeight} style={style} />
    )
  }

  // Uploaded video
  if (video.url) {
    return <UploadedVideoPlayer url={video.url} width={playerWidth} height={playerHeight} style={style} />
  }

  return null
}

function YoutubePlayerWithError({ videoId, playerWidth, playerHeight, style }: { videoId: string; playerWidth: number; playerHeight: number; style?: ViewStyle }) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <View style={[styles.container, style]}>
        <VideoErrorPlaceholder width={playerWidth} height={playerHeight} />
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <YoutubeIframe
        height={playerHeight}
        width={playerWidth}
        videoId={videoId}
        webViewProps={{
          scrollEnabled: false,
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          renderError: () => {
            setHasError(true)
            return <View />
          },
          onError: () => setHasError(true),
        }}
      />
    </View>
  )
}

function UploadedVideoPlayer({ url, width, height, style }: { url: string; width: number; height: number; style?: ViewStyle }) {
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<Video>(null)
  const isFocused = useIsFocused()

  useEffect(() => {
    if (!isFocused) videoRef.current?.pauseAsync()
  }, [isFocused])

  if (hasError) {
    return (
      <View style={[styles.container, style]}>
        <VideoErrorPlaceholder width={width} height={height} />
      </View>
    )
  }

  return (
    <View style={[styles.videoContainer, { width, height }, style]}>
      <Video
        ref={videoRef}
        source={{ uri: url }}
        style={{ width, height }}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        isLooping={false}
        onPlaybackStatusUpdate={status => {
          if (!status.isLoaded) { if (status.error) setHasError(true); return }
          if (status.didJustFinish) videoRef.current?.setStatusAsync({ shouldPlay: false, positionMillis: 0 })
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  videoContainer: {
    marginVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorBox: {
    borderRadius: 8,
    backgroundColor: Colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    color: Colors.mutedForeground,
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
})
