import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Text, TextInput, Button, IconButton, Divider, ActivityIndicator, Snackbar } from 'react-native-paper'
import { Stack } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  useTutorialCategories,
  useCreateCategory, useUpdateCategory, useDeleteCategory,
} from '@/hooks/useTutorials'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Colors } from '@/lib/colors'
import { isNetworkError } from '@/lib/toastService'
import { Fonts } from '@/lib/fonts'
import type { TutorialCategory } from '@/types/database'

export default function CategoriesScreen() {
  const { t, language } = useLanguage()
  const { data: categories = [], isLoading } = useTutorialCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [newDe, setNewDe] = useState('')
  const [newRu, setNewRu] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editDe, setEditDe] = useState('')
  const [editRu, setEditRu] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<TutorialCategory | null>(null)
  const [snackbar, setSnackbar] = useState('')

  const inputProps = {
    mode: 'outlined' as const,
    outlineColor: Colors.border,
    activeOutlineColor: Colors.primary,
    textColor: Colors.foreground,
    style: styles.input,
  }

  const handleCreate = async () => {
    if (!newDe.trim() || !newRu.trim()) return
    try {
      await createCategory.mutateAsync({ name_de: newDe.trim(), name_ru: newRu.trim() })
      setNewDe(''); setNewRu('')
      setSnackbar(t('toastCategoryCreated'))
    } catch (e: any) {
      if (!isNetworkError(e)) setSnackbar(t('toastFailedCreateCategory'))
    }
  }

  const startEdit = (cat: TutorialCategory) => {
    setEditId(cat.id); setEditDe(cat.name_de); setEditRu(cat.name_ru)
  }

  const handleUpdate = async () => {
    if (!editId || !editDe.trim() || !editRu.trim()) return
    try {
      await updateCategory.mutateAsync({ id: editId, data: { name_de: editDe.trim(), name_ru: editRu.trim() } })
      setEditId(null)
      setSnackbar(t('toastCategoryUpdated'))
    } catch (e: any) {
      if (!isNetworkError(e)) setSnackbar(t('toastFailedUpdateCategory'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCategory.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
      setSnackbar(t('toastCategoryDeleted'))
    } catch (e: any) {
      setDeleteTarget(null)
      if (!isNetworkError(e)) setSnackbar(t('toastFailedDeleteCategory'))
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: t('categories'), headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.center} />
        ) : categories.length === 0 ? (
          <Text style={styles.empty}>{t('noCategoriesFound')}</Text>
        ) : (
          categories.map(cat => {
            const name = language === 'de' ? cat.name_de : cat.name_ru
            const isEditing = editId === cat.id
            return (
              <View key={cat.id} style={styles.categoryRow}>
                {isEditing ? (
                  <View style={{ flex: 1 }}>
                    <TextInput label={t('categoryNameDe')} value={editDe} onChangeText={setEditDe} {...inputProps} />
                    <TextInput label={t('categoryNameRu')} value={editRu} onChangeText={setEditRu} {...inputProps} />
                    <View style={styles.editActions}>
                      <Button mode="outlined" onPress={() => setEditId(null)} textColor={Colors.mutedForeground}
                        style={[styles.editBtn, { borderColor: Colors.border }]}>{t('cancel')}</Button>
                      <Button mode="contained" onPress={handleUpdate}
                        loading={updateCategory.isPending} disabled={updateCategory.isPending}
                        buttonColor={Colors.primary} textColor={Colors.primaryForeground}
                        style={styles.editBtn}>{t('save')}</Button>
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.catName}>{name}</Text>
                    <View style={styles.catActions}>
                      <IconButton icon="pencil" size={18} iconColor={Colors.primary} onPress={() => startEdit(cat)} />
                      <IconButton icon="delete" size={18} iconColor={Colors.destructive} onPress={() => setDeleteTarget(cat)} />
                    </View>
                  </>
                )}
              </View>
            )
          })
        )}

        <Divider style={styles.divider} />

        <Text style={styles.sectionLabel}>{t('addCategory')}</Text>
        <TextInput label={t('categoryNameDe')} value={newDe} onChangeText={setNewDe} {...inputProps} />
        <TextInput label={t('categoryNameRu')} value={newRu} onChangeText={setNewRu} {...inputProps} />
        <Button mode="contained" onPress={handleCreate}
          loading={createCategory.isPending} disabled={createCategory.isPending}
          buttonColor={Colors.primary} textColor={Colors.primaryForeground} style={styles.createBtn}>
          {t('addCategory')}
        </Button>
      </ScrollView>

      <ConfirmDialog
        visible={!!deleteTarget}
        title={t('confirmDeleteCategory')}
        message={t('deleteConfirmCategoryMessage')}
        onConfirm={handleDelete}
        onDismiss={() => setDeleteTarget(null)}
        loading={deleteCategory.isPending}
      />
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>{snackbar}</Snackbar>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  center: { marginTop: 40 },
  empty: { color: Colors.mutedForeground, fontStyle: 'italic', marginBottom: 16 },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
    paddingLeft: 14, marginBottom: 8,
  },
  catName: { flex: 1, fontFamily: Fonts.body, color: Colors.foreground, fontSize: 15 },
  catActions: { flexDirection: 'row' },
  editActions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  editBtn: { flex: 1, borderRadius: 4 },
  input: { marginBottom: 8, backgroundColor: Colors.card },
  divider: { backgroundColor: Colors.border, marginVertical: 20 },
  sectionLabel: { fontSize: 13, fontFamily: Fonts.bodySemiBold, color: Colors.foreground, marginBottom: 10 },
  createBtn: { borderRadius: 6, marginTop: 4 },
})
