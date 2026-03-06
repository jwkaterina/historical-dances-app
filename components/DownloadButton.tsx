import { StyleSheet, View } from 'react-native'
import { IconButton, Text } from 'react-native-paper'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import { useTrackDownload } from '@/hooks/useTrackDownload'

const DOWNLOADED_COLOR = Colors.primaryLight

type Props = {
  trackId: string
  audioUrl: string | null
  size?: number
}

export default function DownloadButton({ trackId, audioUrl, size = 22 }: Props) {
  const { state, progress, download, remove } = useTrackDownload(trackId, audioUrl)

  if (!audioUrl) return null

  const outerSize = size + 18

  return (
    <View style={{ width: outerSize, height: outerSize, alignItems: 'center', justifyContent: 'center' }}>
      {state === 'downloading' ? (
        <View style={[styles.progressCircle, { width: size + 14, height: size + 14, borderRadius: (size + 14) / 2 }]}>
          <Text style={[styles.progressText, { fontSize: size * 0.45 }]}>{progress}%</Text>
        </View>
      ) : (
        <IconButton
          icon={state === 'downloaded' ? 'check-circle' : 'cloud-download-outline'}
          iconColor={DOWNLOADED_COLOR}
          size={size}
          style={{ margin: 0 }}
          onPress={state === 'downloaded' ? remove : download}
        />
      )}
    </View>
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
