import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import WebView from 'react-native-webview'
import { Colors } from '@/lib/colors'

export default function WebViewScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>()

  return (
    <>
      <Stack.Screen options={{ title: title ?? '', headerShown: true,
        headerStyle: { backgroundColor: Colors.foreground },
        headerTintColor: Colors.background }} />
      <WebView
        source={{ uri: decodeURIComponent(url) }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      />
    </>
  )
}

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
})
