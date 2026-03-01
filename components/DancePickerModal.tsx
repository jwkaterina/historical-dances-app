import { useState } from 'react'
import { FlatList, StyleSheet } from 'react-native'
import { Modal, Portal, Searchbar, Text, TouchableRipple, Divider } from 'react-native-paper'
import { useLanguage } from '@/contexts/LanguageContext'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'

interface DanceOption {
  id: string
  name: string
  name_de: string | null
  name_ru: string | null
}

interface Props {
  dances: DanceOption[]
  onSelect: (danceId: string) => void
  onDismiss: () => void
}

export default function DancePickerModal({ dances, onSelect, onDismiss }: Props) {
  const { language, t } = useLanguage()
  const [search, setSearch] = useState('')

  const filtered = dances.filter(d => {
    const name = (language === 'de' ? d.name_de : d.name_ru) ?? d.name ?? ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <Portal>
      <Modal visible onDismiss={onDismiss} contentContainerStyle={styles.container}>
        <Text variant="titleMedium" style={styles.title}>{t('selectDances')}</Text>
        <Searchbar
          placeholder={t('search')}
          value={search}
          onChangeText={setSearch}
          style={styles.searchbar}
          inputStyle={{ color: Colors.foreground }}
        />
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          style={styles.list}
          ItemSeparatorComponent={() => <Divider style={{ backgroundColor: Colors.border }} />}
          renderItem={({ item }) => {
            const name = (language === 'de' ? item.name_de : item.name_ru) ?? item.name ?? ''
            return (
              <TouchableRipple onPress={() => onSelect(item.id)} style={styles.item} rippleColor={Colors.accent}>
                <Text variant="bodyMedium" style={styles.itemText}>{name}</Text>
              </TouchableRipple>
            )
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>{t('noDancesFound')}</Text>
          }
        />
      </Modal>
    </Portal>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    margin: 24,
    borderRadius: 8,
    maxHeight: '80%',
    padding: 16,
  },
  title: { fontFamily: Fonts.bodySemiBold, color: Colors.foreground, marginBottom: 12 },
  searchbar: { marginBottom: 8, elevation: 0, backgroundColor: Colors.muted },
  list: { maxHeight: 400 },
  item: { padding: 16 },
  itemText: { color: Colors.foreground },
  empty: { padding: 16, color: Colors.mutedForeground, textAlign: 'center' },
})
