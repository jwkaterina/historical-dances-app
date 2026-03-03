import { StyleSheet, View, Text } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import WebView from 'react-native-webview'
import { ActivityIndicator } from 'react-native-paper'
import { useBall } from '@/hooks/useBalls'
import { useLanguage } from '@/contexts/LanguageContext'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'

export default function BallInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { language, t } = useLanguage()
  const { data: ball, isLoading } = useBall(id)

  const html = ball ? (language === 'de' ? ball.info_de : ball.info_ru) : null

  const styledHtml = html ? `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, Georgia, serif;
      padding: 16px;
      color: #1a1a1a;
      line-height: 1.7;
      font-size: 16px;
      background: #fff;
    }
    h1, h2, h3, h4 {
      font-family: Georgia, serif;
      margin-top: 24px;
      margin-bottom: 8px;
      color: #111;
    }
    h1 { font-size: 22px; }
    h2 { font-size: 18px; }
    h3 { font-size: 16px; }
    p { margin: 0 0 12px; }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 12px 0;
      display: block;
    }
    ul, ol { padding-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 4px; }
    a { color: #7c6345; }
    blockquote {
      border-left: 3px solid #ccc;
      margin: 12px 0;
      padding: 4px 16px;
      color: #666;
    }
    strong { font-weight: 600; }
  </style>
</head>
<body>${html}</body>
</html>` : null

  return (
    <>
      <Stack.Screen options={{
        title: t('ballRules'),
        headerShown: true,
        headerStyle: { backgroundColor: Colors.foreground },
        headerTintColor: Colors.background,
        headerTitle: ({ children, tintColor }) => (
          <Text style={{ fontFamily: Fonts.heading, color: tintColor ?? Colors.background, fontSize: 17 }} numberOfLines={1}>
            {children}
          </Text>
        ),
      }} />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : styledHtml ? (
        <WebView
          source={{ html: styledHtml }}
          style={styles.webview}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
        />
      ) : (
        <View style={styles.center}>
          <Text style={styles.empty}>{t('ballNotFound')}</Text>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  empty: { color: Colors.mutedForeground, fontSize: 16 },
})
