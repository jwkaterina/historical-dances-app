import { useState } from 'react'
import { ScrollView, StyleSheet, View, Image, Modal, TouchableOpacity, Linking, Dimensions } from 'react-native'
import { Text, Button, ActivityIndicator, Chip } from 'react-native-paper'
import { useLocalSearchParams, Stack } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTutorial } from '@/hooks/useTutorials'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/)
  return match ? match[1] : null
}

export default function TutorialDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t, language } = useLanguage()
  const [imageModalVisible, setImageModalVisible] = useState(false)

  const { data: tutorial, isLoading } = useTutorial(id)

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
  const youtubeId = tutorial.video_type === 'youtube' ? getYouTubeId(tutorial.url) : null

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
            {youtubeId ? (
              <Button
                mode="contained"
                icon="youtube"
                onPress={() => Linking.openURL(tutorial.url)}
                style={styles.actionBtn}
                buttonColor={Colors.primary}
                textColor={Colors.primaryForeground}
              >
                {t('openVideo')}
              </Button>
            ) : (
              <Button
                mode="contained"
                icon="play-circle"
                onPress={() => Linking.openURL(tutorial.url)}
                style={styles.actionBtn}
                buttonColor={Colors.primary}
                textColor={Colors.primaryForeground}
              >
                {t('openVideo')}
              </Button>
            )}
          </View>
        )}

        {tutorial.type === 'pdf' && (
          <View style={styles.section}>
            <Button
              mode="contained"
              icon="file-pdf-box"
              onPress={() => Linking.openURL(tutorial.url)}
              style={styles.actionBtn}
              buttonColor={Colors.primary}
              textColor={Colors.primaryForeground}
            >
              {t('openPdf')}
            </Button>
          </View>
        )}

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
      </ScrollView>

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
  actionBtn: { borderRadius: 6 },
  image: { width: '100%', height: SCREEN_WIDTH * 0.75, borderRadius: 8, backgroundColor: Colors.muted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  fullscreenImage: { width: SCREEN_WIDTH, height: SCREEN_WIDTH, },
})
