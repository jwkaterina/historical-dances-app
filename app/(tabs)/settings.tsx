import { StyleSheet, View } from 'react-native'
import { Text, List, Divider, Button, Avatar } from 'react-native-paper'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage()
  const { user, signOut } = useAuth()

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
          right={() => (
            <View style={[styles.langDot, language === 'de' && styles.langDotActive]} />
          )}
          onPress={() => setLanguage('de')}
          style={language === 'de' ? styles.listItemActive : styles.listItem}
        />
        <List.Item
          title="Русский"
          titleStyle={[styles.listTitle, language === 'ru' && styles.listTitleActive]}
          left={props => <List.Icon {...props} icon="translate" color={language === 'ru' ? Colors.primary : Colors.mutedForeground} />}
          right={() => (
            <View style={[styles.langDot, language === 'ru' && styles.langDotActive]} />
          )}
          onPress={() => setLanguage('ru')}
          style={language === 'ru' ? styles.listItemActive : styles.listItem}
        />
      </List.Section>

      <Divider style={styles.divider} />

      <View style={styles.logoutSection}>
        <Button
          mode="outlined"
          icon="logout"
          onPress={signOut}
          textColor={Colors.destructive}
          style={styles.logoutBtn}
        >
          {t('logout')}
        </Button>
      </View>
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
  langDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: Colors.border, alignSelf: 'center', marginRight: 8 },
  langDotActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  logoutSection: { padding: 24 },
  logoutBtn: { borderColor: Colors.destructive },
})
