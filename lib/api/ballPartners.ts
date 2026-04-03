import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = (ballId: string) => `ball_partners_${ballId}`

export async function fetchBallPartners(ballId: string): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY(ballId))
  return raw ? JSON.parse(raw) : {}
}

export async function saveBallPartner(ballId: string, sectionDanceId: string, partnerName: string): Promise<void> {
  const map = await fetchBallPartners(ballId)
  const trimmed = partnerName.trim()
  if (trimmed) {
    map[sectionDanceId] = trimmed
  } else {
    delete map[sectionDanceId]
  }
  await AsyncStorage.setItem(STORAGE_KEY(ballId), JSON.stringify(map))
}
