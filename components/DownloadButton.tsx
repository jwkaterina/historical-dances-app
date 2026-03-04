import { StyleSheet, View } from 'react-native'
import { IconButton, Text } from 'react-native-paper'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import { useTrackDownload } from '@/hooks/useTrackDownload'

const DOWNLOADED_COLOR = '#5a8a62'

type Props = {
  trackId: string
  audioUrl: string | null
}

export default function DownloadButton({ trackId, audioUrl }: Props) {
  const { state, progress, download, remove } = useTrackDownload(trackId, audioUrl)

  if (!audioUrl) return null

  if (state === 'downloading') {
    return (
      <View style={styles.progressCircle}>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    )
  }

  return (
    <IconButton
      icon={state === 'downloaded' ? 'check-circle' : 'cloud-download-outline'}
      iconColor={state === 'downloaded' ? DOWNLOADED_COLOR : Colors.mutedForeground}
      size={22}
      onPress={state === 'downloaded' ? remove : download}
    />
  )
}

const styles = StyleSheet.create({
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  progressText: {
    fontSize: 9,
    fontFamily: Fonts.bodySemiBold,
    color: Colors.primary,
  },
})
