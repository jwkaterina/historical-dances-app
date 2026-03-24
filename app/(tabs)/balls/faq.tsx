import { useState, useCallback } from 'react'
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native'
import { Text, ActivityIndicator, Icon } from 'react-native-paper'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useLanguage } from '@/contexts/LanguageContext'
import { useFaqs } from '@/hooks/useFaqs'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'
import { useAudioPlayer, PLAYER_HEIGHT } from '@/contexts/AudioPlayerContext'
import type { Faq } from '@/types/database'
import WebView from 'react-native-webview'
import type { WebViewMessageEvent } from 'react-native-webview'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'

const PADDING_BOTTOM = 14

function AccordionItem({ faq, language }: { faq: Faq; language: 'de' | 'ru' }) {
  const [expanded, setExpanded] = useState(false)
  const [measured, setMeasured] = useState(false)
  const [webViewHeight, setWebViewHeight] = useState(60)
  const animatedHeight = useSharedValue(0)

  const question = language === 'ru' ? faq.question_ru : faq.question_de
  const answer = language === 'ru' ? faq.answer_ru : faq.answer_de

  const styledHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, Georgia, serif;
      padding: 0 4px;
      color: #4a3f35;
      line-height: 1.6;
      font-size: 15px;
      background: transparent;
    }
    p { margin: 0 0 8px; }
    ul, ol { padding-left: 20px; margin-bottom: 8px; }
    li { margin-bottom: 4px; }
    a { color: #a67c52; }
    strong { font-weight: 600; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; }
  </style>
</head>
<body>${answer}</body>
</html>`

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const { height } = JSON.parse(event.nativeEvent.data)
      if (height && height > 0) {
        const total = height + PADDING_BOTTOM
        setWebViewHeight(height)
        setMeasured(true)
        if (expanded) {
          animatedHeight.value = withTiming(total, { duration: 250 })
        }
      }
    } catch {}
  }, [expanded, animatedHeight])

  const toggle = () => {
    const total = webViewHeight + PADDING_BOTTOM
    if (expanded) {
      animatedHeight.value = withTiming(0, { duration: 200 })
    } else {
      animatedHeight.value = withTiming(measured ? total : total, { duration: 250 })
    }
    setExpanded(!expanded)
  }

  const clipStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    overflow: 'hidden' as const,
  }))

  return (
    <View style={styles.accordionItem}>
      <TouchableOpacity
        style={styles.accordionTrigger}
        onPress={toggle}
        activeOpacity={0.7}
      >
        <Text variant="bodyLarge" style={styles.questionText}>{question}</Text>
        <Icon
          source={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={Colors.mutedForeground}
        />
      </TouchableOpacity>
      <Animated.View style={clipStyle}>
        <View style={[styles.accordionContent, { height: webViewHeight + PADDING_BOTTOM }]}>
          <WebView
            source={{ html: styledHtml }}
            style={{ height: webViewHeight, backgroundColor: 'transparent' }}
            scrollEnabled={false}
            startInLoadingState={false}
            originWhitelist={['*']}
            onMessage={onMessage}
            injectedJavaScript={`
              (function() {
                const sendHeight = () => {
                  const height = document.body.scrollHeight;
                  window.ReactNativeWebView.postMessage(JSON.stringify({ height }));
                };
                sendHeight();
                window.addEventListener('load', sendHeight);
                setTimeout(sendHeight, 100);
                setTimeout(sendHeight, 500);
              })();
              true;
            `}
          />
        </View>
      </Animated.View>
    </View>
  )
}

export default function FaqScreen() {
  const { t, language } = useLanguage()
  const { from } = useLocalSearchParams<{ from?: string }>()
  const { data: faqs = [], isLoading } = useFaqs()
  const { currentTrack } = useAudioPlayer()

  return (
    <>
      <Stack.Screen options={{ title: from || t('balls') }} />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : faqs.length === 0 ? (
        <View style={styles.center}>
          <Text variant="bodyLarge" style={styles.emptyText}>{t('noFaqsYet')}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.content,
            currentTrack && { paddingBottom: PLAYER_HEIGHT + 48 },
          ]}
        >
          <Text variant="headlineMedium" style={styles.title}>{t('faqs')}</Text>
          {faqs.map((faq: Faq) => (
            <AccordionItem key={faq.id} faq={faq} language={language} />
          ))}
        </ScrollView>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontFamily: Fonts.heading, color: Colors.foreground, marginBottom: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  description: { color: Colors.mutedForeground, marginBottom: 16 },
  emptyText: { color: Colors.mutedForeground, textAlign: 'center' },
  accordionItem: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  accordionTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  questionText: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    color: Colors.foreground,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: PADDING_BOTTOM,
  },
})
