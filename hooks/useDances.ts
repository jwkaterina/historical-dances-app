import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchDances, fetchDanceById, createDance, updateDance, deleteDance, syncDanceVideos, syncDanceMusicLinks } from '@/lib/api/dances'
import type { Dance } from '@/types/database'

export const DANCES_KEY = 'dances'

export function useDances(search?: string) {
  return useQuery({
    queryKey: [DANCES_KEY, search],
    queryFn: () => fetchDances(search),
  })
}

export function useDance(id: string) {
  return useQuery({
    queryKey: [DANCES_KEY, id],
    queryFn: () => fetchDanceById(id),
    enabled: !!id,
  })
}

export function useCreateDance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createDance,
    onSuccess: () => qc.invalidateQueries({ queryKey: [DANCES_KEY] }),
  })
}

export function useUpdateDance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Dance> }) => updateDance(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [DANCES_KEY] })
      qc.invalidateQueries({ queryKey: [DANCES_KEY, vars.id] })
    },
  })
}

export function useDeleteDance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteDance,
    onSuccess: () => qc.invalidateQueries({ queryKey: [DANCES_KEY] }),
  })
}

export function useSyncDanceVideos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ danceId, videos }: { danceId: string; videos: Array<{ id?: string; video_type: string; url: string }> }) =>
      syncDanceVideos(danceId, videos),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: [DANCES_KEY, vars.danceId] }),
  })
}

export function useSyncDanceMusicLinks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ danceId, musicIds }: { danceId: string; musicIds: string[] }) =>
      syncDanceMusicLinks(danceId, musicIds),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: [DANCES_KEY, vars.danceId] }),
  })
}
