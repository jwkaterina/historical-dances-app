import { useState, useEffect } from 'react'
import { View, StyleSheet, ViewStyle, useWindowDimensions, TouchableOpacity } from 'react-native'
import { Icon, Text } from 'react-native-paper'
import YoutubeIframe from 'react-native-youtube-iframe'
import { useVideoPlayer, VideoView } from 'expo-video'
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
  const isFocused = useIsFocused()
  const [ended, setEnded] = useState(false)
  const player = useVideoPlayer({ uri: url }, p => { p.loop = false })

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => setEnded(true))
    return () => sub.remove()
  }, [player])

  useEffect(() => {
    if (!isFocused) player.pause()
  }, [isFocused])

  const handleReplay = () => {
    setEnded(false)
    player.seekBy(-player.currentTime)
    player.play()
  }

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={{ width, height, borderRadius: 8 }}
        contentFit="contain"
        nativeControls
        allowsFullscreen
        allowsPictureInPicture
      />
      {ended && (
        <TouchableOpacity
          style={[styles.replayOverlay, { width, height, borderRadius: 8 }]}
          onPress={handleReplay}
          activeOpacity={0.8}
        >
          <View style={styles.replayButton}>
            <Icon source="replay" size={36} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginVertical: 4 },
  replayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replayButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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
