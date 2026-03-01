import { StyleSheet, View } from 'react-native'
import { Text, List, Divider, Button, Avatar, Switch } from 'react-native-paper'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage()
  const { user, signOut } = useAuth()

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Avatar.Icon size={64} icon="account" style={styles.avatar} />
        <Text variant="titleMedium" style={styles.email}>{user?.email}</Text>
      </View>

      <Divider />

      <List.Section>
        <List.Subheader>{t('language')}</List.Subheader>
        <List.Item
          title="Deutsch"
          left={props => <List.Icon {...props} icon="translate" />}
          right={() => (
            <Switch
              value={language === 'de'}
              onValueChange={() => setLanguage('de')}
              color="#6750a4"
            />
          )}
        />
        <List.Item
          title="Русский"
          left={props => <List.Icon {...props} icon="translate" />}
          right={() => (
            <Switch
              value={language === 'ru'}
              onValueChange={() => setLanguage('ru')}
              color="#6750a4"
            />
          )}
        />
      </List.Section>

      <Divider />

      <View style={styles.logoutSection}>
        <Button
          mode="outlined"
          icon="logout"
          onPress={signOut}
          textColor="red"
          style={styles.logoutBtn}
        >
          {t('logout')}
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f5f5' },
  profileSection: { alignItems: 'center', padding: 24 },
  avatar: { backgroundColor: '#6750a4', marginBottom: 12 },
  email: { opacity: 0.7 },
  logoutSection: { padding: 24 },
  logoutBtn: { borderColor: 'red' },
})
