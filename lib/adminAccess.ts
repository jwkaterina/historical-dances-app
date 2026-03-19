import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'admin_access_unlocked'

export async function getAdminAccessUnlocked(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === 'true'
}

export async function setAdminAccessUnlocked(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true')
}
