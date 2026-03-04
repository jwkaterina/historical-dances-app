import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Network from 'expo-network'

const KEY = 'download_wifi_only'

export async function getWifiOnlySetting(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEY)
  return val === null ? true : val === 'true' // default on
}

export async function setWifiOnlySetting(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, String(enabled))
}

export async function canDownloadNow(): Promise<boolean> {
  const wifiOnly = await getWifiOnlySetting()
  if (!wifiOnly) return true
  const state = await Network.getNetworkStateAsync()
  return state.type === Network.NetworkStateType.WIFI
}
