import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, TextInput, Button, SegmentedButtons, Snackbar, ActivityIndicator, Menu, Divider } from 'react-native-paper'
import { useRouter } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTutorial, useTutorialCategories, useCreateTutorial, useUpdateTutorial } from '@/hooks/useTutorials'
import { uploadFile, generateFileName } from '@/lib/upload'
import { isNetworkError } from '@/lib/toastService'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'

interface Props {
  tutorialId?: string
}

export default function TutorialForm({ tutorialId }: Props) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const isEdit = !!tutorialId

  const { data: existing, isLoading } = useTutorial(tutorialId ?? '')
  const { data: categories = [] } = useTutorialCategories()
  const createTutorial = useCreateTutorial()
  const updateTutorial = useUpdateTutorial()

  const [titleDe, setTitleDe] = useState('')
  const [titleRu, setTitleRu] = useState('')
  const [type, setType] = useState<'video' | 'pdf' | 'image'>('video')
  const [videoType, setVideoType] = useState<'youtube' | 'uploaded'>('youtube')
  const [url, setUrl] = useState('')
  const [localUri, setLocalUri] = useState<string | undefined>()
  const [mimeType, setMimeType] = useState<string | undefined>()
  const [fileName, setFileName] = useState<string | undefined>()
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [catMenuVisible, setCatMenuVisible] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (existing) {
      setTitleDe(existing.title_de ?? '')
      setTitleRu(existing.title_ru ?? '')
      setType((existing.type as any) ?? 'video')
      setVideoType((existing.video_type as any) ?? 'youtube')
      setUrl(existing.url ?? '')
      setCategoryId(existing.category_id ?? null)
    }
  }, [existing])

  const pickVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['video/*'] })
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0]
      setLocalUri(a.uri)
      setMimeType(a.mimeType ?? 'video/mp4')
      setFileName(a.name)
      setUrl(a.name)
    }
  }

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf'] })
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0]
      setLocalUri(a.uri)
      setMimeType('application/pdf')
      setFileName(a.name)
      setUrl(a.name)
    }
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    })
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0]
      const mime = a.mimeType ?? 'image/jpeg'
      const ext = mime.split('/')[1] ?? 'jpg'
      setLocalUri(a.uri)
      setMimeType(mime)
      setFileName(`image.${ext}`)
      setUrl(`image.${ext}`)
    }
  }

  const handleSubmit = async () => {
    if (!titleDe.trim() || !titleRu.trim()) { setError(t('toastNameRequiredBothLanguages')); return }
    if (type === 'video' && videoType === 'youtube' && !url.trim()) { setError(t('urlRequired')); return }
    if ((type === 'pdf' || type === 'image' || (type === 'video' && videoType === 'uploaded')) && !url.trim()) {
      setError(t('fileRequired')); return
    }

    try {
      setUploading(true)
      let finalUrl = url

      if (localUri && mimeType) {
        const bucket = type === 'pdf' ? 'documents' : type === 'image' ? 'images' : 'videos'
        const ext = mimeType.split('/')[1] ?? 'bin'
        finalUrl = await uploadFile(bucket, generateFileName(type, ext), localUri, mimeType)
      }

      const payload = {
        title_de: titleDe.trim(),
        title_ru: titleRu.trim(),
        type,
        video_type: type === 'video' ? videoType : null,
        url: finalUrl,
        category_id: categoryId,
      }

      if (isEdit && tutorialId) {
        await updateTutorial.mutateAsync({ id: tutorialId, data: payload })
      } else {
        await createTutorial.mutateAsync(payload)
      }
      router.back()
    } catch (e: any) {
      if (!isNetworkError(e)) setError(t(isEdit ? 'toastFailedUpdateTutorial' : 'toastFailedCreateTutorial'))
    } finally {
      setUploading(false)
    }
  }

  if (isEdit && isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.primary} />

  const isSaving = uploading || createTutorial.isPending || updateTutorial.isPending

  const inputProps = {
    mode: 'outlined' as const,
    outlineColor: Colors.border,
    activeOutlineColor: Colors.primary,
    textColor: Colors.foreground,
    style: styles.input,
  }

  const selectedCategory = categories.find(c => c.id === categoryId)

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        <TextInput label={t('tutorialTitleDe')} value={titleDe} onChangeText={setTitleDe} {...inputProps} />
        <TextInput label={t('tutorialTitleRu')} value={titleRu} onChangeText={setTitleRu} {...inputProps} />

        <Divider style={styles.divider} />

        <Text style={styles.fieldLabel}>{t('tutorialType')}</Text>
        <SegmentedButtons
          value={type}
          onValueChange={v => { setType(v as any); setUrl(''); setLocalUri(undefined); setMimeType(undefined); setFileName(undefined) }}
          buttons={[
            { value: 'video', label: t('typeVideo'), style: type === 'video' ? styles.segActive : styles.segInactive },
            { value: 'pdf', label: t('typePdf'), style: type === 'pdf' ? styles.segActive : styles.segInactive },
            { value: 'image', label: t('typeImage'), style: type === 'image' ? styles.segActive : styles.segInactive },
          ]}
          style={styles.segmented}
        />

        {type === 'video' && (
          <>
            <Text style={styles.fieldLabel}>{t('videoType')}</Text>
            <SegmentedButtons
              value={videoType}
              onValueChange={v => { setVideoType(v as any); setUrl(''); setLocalUri(undefined); setMimeType(undefined); setFileName(undefined) }}
              buttons={[
                { value: 'youtube', label: 'YouTube', style: videoType === 'youtube' ? styles.segActive : styles.segInactive },
                { value: 'uploaded', label: t('uploadedVideo'), style: videoType === 'uploaded' ? styles.segActive : styles.segInactive },
              ]}
              style={styles.segmented}
            />
            {videoType === 'youtube' ? (
              <TextInput label={t('youtubeUrl')} value={url} onChangeText={setUrl}
                placeholder={t('youtubePlaceholder')} {...inputProps} />
            ) : (
              <>
                {fileName ? <Text style={styles.uploadedNote}>📎 {fileName}</Text> : null}
                <Button mode="outlined" icon="folder-open" onPress={pickVideo}
                  style={styles.pickBtn} textColor={Colors.primary}>
                  {fileName ? t('videoUploaded') : t('selectVideo')}
                </Button>
              </>
            )}
          </>
        )}

        {type === 'pdf' && (
          <>
            {fileName ? <Text style={styles.uploadedNote}>📄 {fileName}</Text> : null}
            <Button mode="outlined" icon="file-pdf-box" onPress={pickPdf}
              style={styles.pickBtn} textColor={Colors.primary}>
              {fileName ? t('pdfSelected') : t('selectPdf')}
            </Button>
          </>
        )}

        {type === 'image' && (
          <>
            {fileName ? <Text style={styles.uploadedNote}>🖼 {fileName}</Text> : null}
            <Button mode="outlined" icon="image" onPress={pickImage}
              style={styles.pickBtn} textColor={Colors.primary}>
              {fileName ? t('imageSelected') : t('selectImage')}
            </Button>
          </>
        )}

        <Divider style={styles.divider} />

        <Text style={styles.fieldLabel}>{t('categories')}</Text>
        <Menu
          visible={catMenuVisible}
          onDismiss={() => setCatMenuVisible(false)}
          anchor={
            <Button mode="outlined" onPress={() => setCatMenuVisible(true)}
              style={styles.menuBtn} textColor={categoryId ? Colors.foreground : Colors.mutedForeground}>
              {selectedCategory
                ? (language === 'de' ? selectedCategory.name_de : selectedCategory.name_ru)
                : t('selectCategory')}
            </Button>
          }
        >
          <Menu.Item title={t('noCategory')} onPress={() => { setCategoryId(null); setCatMenuVisible(false) }}
            titleStyle={{ color: Colors.mutedForeground }} />
          {categories.map(cat => (
            <Menu.Item key={cat.id}
              title={language === 'de' ? cat.name_de : cat.name_ru}
              onPress={() => { setCategoryId(cat.id); setCatMenuVisible(false) }}
              titleStyle={{ color: Colors.foreground }} />
          ))}
        </Menu>

        <Button mode="contained" onPress={handleSubmit} loading={isSaving} disabled={isSaving}
          style={styles.submitBtn} buttonColor={Colors.primary} textColor={Colors.primaryForeground}>
          {isSaving ? t('saving') : isEdit ? t('update') : t('create')}
        </Button>
      </ScrollView>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={4000}
        style={{ backgroundColor: Colors.destructive }}>{error}</Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  input: { marginBottom: 12, backgroundColor: Colors.card },
  divider: { backgroundColor: Colors.border, marginVertical: 16 },
  fieldLabel: { fontSize: 11, fontFamily: Fonts.heading, color: Colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  segmented: { marginBottom: 12 },
  segActive: { backgroundColor: Colors.primary },
  segInactive: { backgroundColor: Colors.card },
  pickBtn: { borderColor: Colors.border, borderRadius: 4, marginBottom: 8 },
  uploadedNote: { color: Colors.mutedForeground, fontSize: 12, marginBottom: 8 },
  menuBtn: { borderColor: Colors.border, borderRadius: 4, justifyContent: 'flex-start' },
  submitBtn: { marginTop: 24, borderRadius: 6 },
})
