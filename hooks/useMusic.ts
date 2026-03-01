import { useQuery } from '@tanstack/react-query'
import { fetchMusic } from '@/lib/api/music'

export const MUSIC_KEY = 'music'

export function useMusic(search?: string) {
  return useQuery({
    queryKey: [MUSIC_KEY, search],
    queryFn: () => fetchMusic(search),
  })
}
