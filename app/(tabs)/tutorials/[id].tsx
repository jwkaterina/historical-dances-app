import { useState } from 'react'
import { ScrollView, StyleSheet, View, Image, Modal, TouchableOpacity, Pressable, Dimensions } from 'react-native'
import WebView from 'react-native-webview'
import { Text, ActivityIndicator, Chip, Button, Snackbar } from 'react-native-paper'
import { useLocalSearchParams, Stack, useRouter } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import { useTutorial, useDeleteTutorial } from '@/hooks/useTutorials'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import VideoPlayer from '@/components/VideoPlayer'
import ConfirmDialog from '@/components/ConfirmDialog'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function TutorialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t, language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [imageModalVisible, setImageModalVisible] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [snackbar, setSnackbar] = useState('')
  const [pdfHeight, setPdfHeight] = useState(SCREEN_WIDTH * 1.414)

  const { data: tutorial, isLoading } = useTutorial(id)
  const deleteMutation = useDeleteTutorial()

  const handleDelete = async () => {
    if (!tutorial) return
    const { error } = await deleteMutation.mutateAsync(tutorial.id).then(() => ({ error: null })).catch(e => ({ error: e }))
    if (error) { setSnackbar(error.message ?? t('toastFailedDeleteTutorial')); setShowDelete(false); return }
    router.back()
  }

  if (isLoading) return <ActivityIndicator style={styles.center} size="large" color={Colors.primary} />
  if (!tutorial) return (
    <View style={styles.center}>
      <Text style={{ color: Colors.mutedForeground }}>{t('tutorialNotFound')}</Text>
    </View>
  )

  const title = (language === 'de' ? tutorial.title_de : tutorial.title_ru) ?? ''
  const category = tutorial.tutorial_categories
    ? (language === 'de' ? tutorial.tutorial_categories.name_de : tutorial.tutorial_categories.name_ru)
    : null

  const typeLabel = t(('type' + tutorial.type.charAt(0).toUpperCase() + tutorial.type.slice(1)) as any)
  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>{title}</Text>

        <View style={styles.meta}>
          <Chip compact style={styles.typeBadge} textStyle={styles.typeBadgeText} icon={
            tutorial.type === 'video' ? 'play-circle' : tutorial.type === 'pdf' ? 'file-pdf-box' : 'image'
          }>
            {typeLabel}
          </Chip>
          {category && <Text variant="bodySmall" style={styles.category}>{category}</Text>}
        </View>

        {tutorial.type === 'video' && (
          <View style={styles.section}>
            <VideoPlayer video={{ video_type: tutorial.video_type ?? 'uploaded', url: tutorial.url }} />
          </View>
        )}

        {tutorial.type === 'pdf' && (() => {
          const pdfTitle = decodeURIComponent(tutorial.url.split('/').pop() ?? 'document.pdf')
          const openFullscreen = () => router.push({ pathname: '/pdf-viewer', params: { url: encodeURIComponent(tutorial.url), title: pdfTitle } })
          const pdfUrl = JSON.stringify(tutorial.url)
          const pdfPreviewHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff;overflow:hidden}canvas{display:block}.sep{height:4px;background:#eee}</style></head><body><script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script><script>pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';pdfjsLib.getDocument(${pdfUrl}).promise.then(function(pdf){var t=pdf.numPages;function r(n){return pdf.getPage(n).then(function(p){var dpr=window.devicePixelRatio||1,v0=p.getViewport({scale:1}),s=window.innerWidth/v0.width,v=p.getViewport({scale:s*dpr}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;c.style.width=(v.width/dpr)+'px';c.style.height=(v.height/dpr)+'px';document.body.appendChild(c);if(n<t){var d=document.createElement('div');d.className='sep';document.body.appendChild(d);}return p.render({canvasContext:c.getContext('2d'),viewport:v}).promise.then(function(){if(n<t)return r(n+1);window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));});})}r(1);}).catch(function(){document.body.innerHTML='<p style="padding:20px;color:#999;text-align:center">Cannot load PDF<\/p>';window.ReactNativeWebView.postMessage('200');});<\/script></body></html>`
          return (
            <View style={styles.section}>
              <View style={[styles.pdfPreviewContainer, { height: pdfHeight }]}>
                <WebView
                  source={{ html: pdfPreviewHtml }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                  onMessage={e => { const h = Number(e.nativeEvent.data); if (h > 0) setPdfHeight(h) }}
                  startInLoadingState
                  renderLoading={() => (
                    <View style={styles.pdfLoader}>
                      <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                  )}
                />
                <Pressable style={StyleSheet.absoluteFill} onPress={openFullscreen} />
              </View>
            </View>
          )
        })()}

        {tutorial.type === 'image' && (
          <View style={styles.section}>
            <TouchableOpacity onPress={() => setImageModalVisible(true)} activeOpacity={0.85}>
              <Image
                source={{ uri: tutorial.url }}
                style={styles.image}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        )}
        {isAuthenticated && (
          <View style={styles.actions}>
            <Button mode="outlined" icon="pencil" onPress={() => router.push(`/(tabs)/tutorials/edit/${tutorial.id}`)}
              style={styles.actionBtn} textColor={Colors.primary}>{t('edit')}</Button>
            <Button mode="outlined" icon="delete" onPress={() => setShowDelete(true)}
              style={styles.actionBtn} textColor={Colors.destructive}>{t('deleteTutorial')}</Button>
          </View>
        )}
      </ScrollView>

      <ConfirmDialog visible={showDelete} title={t('confirmDeleteTutorial')} message={t('deleteConfirmTutorialMessage')}
        onConfirm={handleDelete} onDismiss={() => setShowDelete(false)} loading={deleteMutation.isPending} />
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={4000}>{snackbar}</Snackbar>

      <Modal visible={imageModalVisible} transparent animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setImageModalVisible(false)}>
          <Image
            source={{ uri: tutorial.url }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>

    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontFamily: Fonts.heading, color: Colors.foreground, marginBottom: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  typeBadge: { borderRadius: 4, backgroundColor: Colors.muted },
  typeBadgeText: { fontSize: 12, color: Colors.mutedForeground },
  category: { color: Colors.mutedForeground },
  section: { marginBottom: 16 },
  actionBtn: { flex: 1, borderColor: Colors.border },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  image: { width: '100%', height: SCREEN_WIDTH * 0.75, borderRadius: 8, backgroundColor: Colors.muted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  fullscreenImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.4 },
  pdfPreviewContainer: {
    width: '100%', borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  pdfLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.muted },
  pdfThumb: {
    width: '100%', height: SCREEN_WIDTH * 0.75, borderRadius: 8,
    backgroundColor: '#fafafa', borderWidth: 1, borderColor: Colors.border,
    padding: 20, justifyContent: 'space-between',
  },
  pdfPageLines: { flex: 1, gap: 7, paddingTop: 4 },
  pdfLine: { height: 7, borderRadius: 4, backgroundColor: Colors.muted },
  pdfBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: Colors.destructive, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
  },
  pdfBadgeText: { color: '#fff', fontSize: 11, fontFamily: Fonts.bodySemiBold },
  pdfFilename: { color: Colors.mutedForeground, fontSize: 12, fontFamily: Fonts.body, marginTop: 8 },
})
