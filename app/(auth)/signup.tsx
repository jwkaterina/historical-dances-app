import { useState } from 'react'
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Text, TextInput, Button, Snackbar } from 'react-native-paper'
import { Link } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'

export default function SignupScreen() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignUp = async () => {
    if (!email || !password || !repeat) { setError(t('fillAllFields')); return }
    if (password !== repeat) { setError(t('passwordsNoMatch')); return }
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (authError) setError(authError.message)
    else setSuccess(true)
  }

  if (success) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <Text variant="headlineMedium" style={styles.title}>{t('signUpSuccess')}</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>{t('signUpSuccessMessage')}</Text>
        <Link href="/(auth)/login" asChild>
          <Button mode="contained" style={styles.button} buttonColor={Colors.primary} textColor={Colors.primaryForeground}>
            {t('login')}
          </Button>
        </Link>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text variant="headlineMedium" style={styles.title}>{t('signUp')}</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>{t('signUpDescription')}</Text>

        <TextInput label={t('email')} value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none" style={styles.input} mode="outlined"
          outlineColor={Colors.border} activeOutlineColor={Colors.primary} textColor={Colors.foreground} />
        <TextInput label={t('password')} value={password} onChangeText={setPassword}
          secureTextEntry autoCapitalize="none" style={styles.input} mode="outlined"
          outlineColor={Colors.border} activeOutlineColor={Colors.primary} textColor={Colors.foreground} />
        <TextInput label={t('repeatPassword')} value={repeat} onChangeText={setRepeat}
          secureTextEntry autoCapitalize="none" style={styles.input} mode="outlined"
          outlineColor={Colors.border} activeOutlineColor={Colors.primary} textColor={Colors.foreground} />

        <Button mode="contained" onPress={handleSignUp} loading={loading} disabled={loading}
          style={styles.button} buttonColor={Colors.primary} textColor={Colors.primaryForeground}>
          {loading ? t('signingUp') : t('signUp')}
        </Button>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={styles.footerText}>{t('hasAccount')} </Text>
          <Link href="/(auth)/login" asChild>
            <Text variant="bodyMedium" style={styles.link}>{t('login')}</Text>
          </Link>
        </View>
      </ScrollView>
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={4000}
        style={{ backgroundColor: Colors.destructive }}>{error}</Snackbar>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  successContainer: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { textAlign: 'center', marginBottom: 8, fontFamily: Fonts.heading, color: Colors.foreground },
  subtitle: { textAlign: 'center', marginBottom: 32, color: Colors.mutedForeground },
  input: { marginBottom: 16, backgroundColor: Colors.card },
  button: { marginTop: 8, borderRadius: 6 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: Colors.mutedForeground },
  link: { color: Colors.primary, fontFamily: Fonts.bodySemiBold },
})
