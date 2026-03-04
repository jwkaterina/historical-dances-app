import { useState, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text, List, Divider, Button, Avatar, ActivityIndicator, Switch, Snackbar } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import { toastService } from '@/lib/toastService'
import { useMusic } from '@/hooks/useMusic'
import { isTrackDownloaded, downloadTrackFile, deleteAllTrackFiles } from '@/hooks/useTrackDownload'
import { getWifiOnlySetting, setWifiOnlySetting, canDownloadNow } from '@/lib/downloadPrefs'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { data: allTracks = [] } = useMusic()

  const [dlState, setDlState] = useState<'idle' | 'downloading' | 'done'>('idle')
  const [dlProgress, setDlProgress] = useState({ done: 0, total: 0 })
  const [wifiOnly, setWifiOnly] = useState(true)
  const [snackbar, setSnackbar] = useState('')

  useEffect(() => {
    getWifiOnlySetting().then(setWifiOnly)
  }, [])

  // On mount (and whenever track list loads), check how many are already downloaded
  useEffect(() => {
    const tracks = allTracks.filter(tr => !!tr.audio_url)
    if (tracks.length === 0) return
    Promise.all(tracks.map(tr => isTrackDownloaded(tr.id))).then(results => {
      const downloadedCount = results.filter(Boolean).length
      if (downloadedCount === tracks.length) {
        setDlState('done')
        setDlProgress({ done: tracks.length, total: tracks.length })
      } else {
        setDlState('idle')
      }
    })
  }, [allTracks])

  const handleWifiOnlyChange = (val: boolean) => {
    setWifiOnly(val)
    setWifiOnlySetting(val)
  }

  const handleDownloadAll = async () => {
    if (!await canDownloadNow()) {
      setSnackbar(t('wifiRequiredForDownload'))
      return
    }
    const tracks = allTracks.filter(tr => !!tr.audio_url)
    if (tracks.length === 0) return
    setDlProgress({ done: 0, total: tracks.length })
    setDlState('downloading')

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i]
      const already = await isTrackDownloaded(track.id)
      if (!already) await downloadTrackFile(track.id, track.audio_url!)
      setDlProgress({ done: i + 1, total: tracks.length })
    }

    setDlState('done')
  }

  const handleDeleteAll = async () => {
    await deleteAllTrackFiles()
    setDlState('idle')
    setDlProgress({ done: 0, total: 0 })
  }

  const tracksWithAudio = allTracks.filter(tr => !!tr.audio_url)

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Avatar.Icon size={64} icon="account" style={styles.avatar} color={Colors.primaryForeground} />
        <Text variant="titleMedium" style={styles.email}>{user?.email}</Text>
      </View>

      <Divider style={styles.divider} />

      <List.Section>
        <List.Subheader style={styles.subheader}>{t('language')}</List.Subheader>

        <List.Item
          title="Deutsch"
          titleStyle={[styles.listTitle, language === 'de' && styles.listTitleActive]}
          left={props => <List.Icon {...props} icon="translate" color={language === 'de' ? Colors.primary : Colors.mutedForeground} />}
          right={() => <View style={[styles.langDot, language === 'de' && styles.langDotActive]} />}
          onPress={() => setLanguage('de')}
          style={language === 'de' ? styles.listItemActive : styles.listItem}
        />
        <List.Item
          title="Русский"
          titleStyle={[styles.listTitle, language === 'ru' && styles.listTitleActive]}
          left={props => <List.Icon {...props} icon="translate" color={language === 'ru' ? Colors.primary : Colors.mutedForeground} />}
          right={() => <View style={[styles.langDot, language === 'ru' && styles.langDotActive]} />}
          onPress={() => setLanguage('ru')}
          style={language === 'ru' ? styles.listItemActive : styles.listItem}
        />
      </List.Section>

      <Divider style={styles.divider} />

      <List.Section>
        <List.Subheader style={styles.subheader}>{t('offlineMode')}</List.Subheader>

        {/* WiFi only toggle */}
        <List.Item
          title={t('wifiOnly')}
          description={t('wifiOnlyDesc')}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDesc}
          style={styles.listItem}
          right={() => (
            <Switch
              value={wifiOnly}
              onValueChange={handleWifiOnlyChange}
              color={Colors.primary}
            />
          )}
        />

        {/* Download all */}
        <View style={styles.downloadRow}>
          <View style={styles.downloadInfo}>
            <Text style={styles.downloadTitle}>{t('downloadAllMusic')}</Text>
            <Text style={styles.downloadDesc}>
              {dlState === 'downloading'
                ? `${t('downloadAllMusicProgress')} ${dlProgress.done} / ${dlProgress.total}`
                : dlState === 'done'
                ? `${t('downloadAllMusicDone')} (${dlProgress.total})`
                : t('downloadAllMusicDesc')}
            </Text>
          </View>
          {dlState === 'downloading' ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Button
              mode="contained"
              icon={dlState === 'done' ? 'check-circle' : 'cloud-download-outline'}
              onPress={dlState === 'idle' ? handleDownloadAll : () => setDlState('idle')}
              buttonColor={dlState === 'done' ? Colors.muted : Colors.primary}
              textColor={dlState === 'done' ? Colors.mutedForeground : Colors.primaryForeground}
              style={styles.actionBtn}
              disabled={tracksWithAudio.length === 0}
              compact
            >
              {dlState === 'done' ? t('downloadAllMusicDone') : t('downloadAllMusic')}
            </Button>
          )}
        </View>

        {/* Delete all downloads */}
        <View style={styles.downloadRow}>
          <View style={styles.downloadInfo}>
            <Text style={styles.deleteTitle}>{t('deleteAllDownloads')}</Text>
            <Text style={styles.downloadDesc}>{t('deleteAllDownloadsDesc')}</Text>
          </View>
          <Button
            mode="outlined"
            icon="delete-sweep"
            onPress={handleDeleteAll}
            textColor={Colors.destructive}
            style={styles.deleteBtn}
            compact
          >
            {t('deleteAllDownloads')}
          </Button>
        </View>
      </List.Section>

      <Divider style={styles.divider} />

      <View style={styles.logoutSection}>
        {user ? (
          <Button
            mode="outlined"
            icon="logout"
            onPress={async () => { await signOut(); toastService.show('toastLoggedOut') }}
            textColor={Colors.destructive}
            style={styles.logoutBtn}
          >
            {t('logout')}
          </Button>
        ) : (
          <Button
            mode="outlined"
            icon="login"
            onPress={() => router.push('/(auth)/login')}
            textColor={Colors.primary}
            style={styles.loginBtn}
          >
            {t('login')}
          </Button>
        )}
      </View>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={4000}>
        {snackbar}
      </Snackbar>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileSection: { alignItems: 'center', padding: 24, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { backgroundColor: Colors.primary, marginBottom: 12 },
  email: { color: Colors.mutedForeground },
  divider: { backgroundColor: Colors.border },
  subheader: { color: Colors.mutedForeground, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  listItem: { backgroundColor: Colors.background },
  listItemActive: { backgroundColor: Colors.card },
  listTitle: { color: Colors.foreground },
  listTitleActive: { color: Colors.primary, fontFamily: Fonts.bodySemiBold },
  listDesc: { color: Colors.mutedForeground, fontSize: 12 },
  langDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: Colors.border, alignSelf: 'center', marginRight: 8 },
  langDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  downloadRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  downloadInfo: { flex: 1 },
  downloadTitle: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground, fontSize: 14, marginBottom: 2 },
  deleteTitle: { fontFamily: Fonts.bodySemiBold, color: Colors.destructive, fontSize: 14, marginBottom: 2 },
  downloadDesc: { color: Colors.mutedForeground, fontSize: 12 },
  actionBtn: { borderRadius: 6 },
  deleteBtn: { borderRadius: 6, borderColor: Colors.destructive },
  logoutSection: { padding: 24 },
  logoutBtn: { borderColor: Colors.destructive },
  loginBtn: { borderColor: Colors.primary },
})
