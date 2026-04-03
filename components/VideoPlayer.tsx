import { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, ViewStyle, useWindowDimensions, TouchableOpacity } from 'react-native'
import { Icon, Text } from 'react-native-paper'
import YoutubeIframe from 'react-native-youtube-iframe'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useIsFocused } from '@react-navigation/native'
import Constants from 'expo-constants'
import { useLanguage } from '@/contexts/LanguageContext'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'
import { onVideoPauseRequest } from '@/lib/playbackCoordinator'
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
  const { stop: stopAudio } = useAudioPlayer()
  const [hasError, setHasError] = useState(false)
  const [mountKey, setMountKey] = useState(0)

  useEffect(() => {
    return onVideoPauseRequest(() => setMountKey(k => k + 1))
  }, [])

  const onStateChange = useCallback((state: string) => {
    if (state === 'playing') stopAudio()
  }, [stopAudio])

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
        key={mountKey}
        height={playerHeight}
        width={playerWidth}
        videoId={videoId}
        onChangeState={onStateChange}
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
  const { stop: stopAudio } = useAudioPlayer()
  const isFocused = useIsFocused()
  const [started, setStarted] = useState(false)
  const [ended, setEnded] = useState(false)
  const player = useVideoPlayer({ uri: url }, p => { p.loop = false })

  useEffect(() => {
    const sub = player.addListener('playToEnd', () => { setEnded(true); setStarted(false) })
    return () => sub.remove()
  }, [player])

  useEffect(() => {
    if (!isFocused) player.pause()
  }, [isFocused])

  // Pause video when audio starts
  useEffect(() => {
    return onVideoPauseRequest(() => player.pause())
  }, [player])

  // Stop audio when video starts playing (covers native controls too)
  useEffect(() => {
    const sub = player.addListener('playingChange', ({ isPlaying: nowPlaying }: { isPlaying: boolean }) => {
      if (nowPlaying) stopAudio()
    })
    return () => sub.remove()
  }, [player, stopAudio])

  const handlePlay = () => {
    setStarted(true)
    setEnded(false)
    player.play()
  }

  const handleReplay = () => {
    setEnded(false)
    setStarted(true)
    player.seekBy(-player.currentTime)
    player.play()
  }

  return (
    <View style={[styles.container, style]}>
      <VideoView
        player={player}
        style={{ width, height, borderRadius: 8 }}
        contentFit="contain"
        nativeControls={started}
        allowsFullscreen
        allowsPictureInPicture
      />
      {Constants.executionEnvironment !== 'storeClient' && (() => {
        const { CastButton } = require('react-native-google-cast')
        return (
          <View style={styles.castOverlay}>
            <CastButton style={styles.castButton} />
          </View>
        )
      })()}
      {!started && !ended && (
        <TouchableOpacity
          style={[styles.replayOverlay, { width, height, borderRadius: 8 }]}
          onPress={handlePlay}
          activeOpacity={0.8}
        >
          <View style={styles.replayButton}>
            <Icon source="play" size={36} color="#fff" />
          </View>
        </TouchableOpacity>
      )}
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
  castOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  castButton: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
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
