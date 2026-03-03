import { StyleSheet, View, Share, TouchableOpacity, Text } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import WebView from 'react-native-webview'
import { ActivityIndicator, Icon } from 'react-native-paper'
import { Colors } from '@/lib/colors'
import { Fonts } from '@/lib/fonts'

export default function PdfViewerScreen() {
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>()
  const decodedUrl = decodeURIComponent(url)
  const pdfUrl = JSON.stringify(decodedUrl)

  const handleShare = () => Share.share({ url: decodedUrl, message: decodedUrl })

  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=3"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#404040}canvas{display:block;margin-bottom:8px}</style></head><body><script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"><\/script><script>pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';pdfjsLib.getDocument(${pdfUrl}).promise.then(function(pdf){var t=pdf.numPages;function r(n){return pdf.getPage(n).then(function(p){var dpr=window.devicePixelRatio||1,v0=p.getViewport({scale:1}),s=window.innerWidth/v0.width,v=p.getViewport({scale:s*dpr}),c=document.createElement('canvas');c.width=v.width;c.height=v.height;c.style.width=(v.width/dpr)+'px';c.style.height=(v.height/dpr)+'px';document.body.appendChild(c);return p.render({canvasContext:c.getContext('2d'),viewport:v}).promise.then(function(){if(n<t)return r(n+1);});})}r(1);}).catch(function(){document.body.innerHTML='<p style="padding:40px;color:#ccc;text-align:center;font-size:16px">Cannot load PDF<\/p>';});<\/script></body></html>`

  return (
    <>
      <Stack.Screen options={{
        title: title ?? '',
        headerShown: true,
        headerStyle: { backgroundColor: Colors.foreground },
        headerTintColor: Colors.background,
        headerTitle: ({ children, tintColor }) => (
          <Text style={{ fontFamily: Fonts.heading, color: tintColor ?? Colors.background, fontSize: 17 }} numberOfLines={1}>
            {children}
          </Text>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
            <Icon source="share-variant" size={22} color={Colors.background} />
          </TouchableOpacity>
        ),
      }} />
      <WebView
        source={{ html }}
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
  webview: { flex: 1, backgroundColor: '#404040' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  headerBtn: { padding: 8 },
})
