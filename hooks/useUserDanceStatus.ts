import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchUserDanceStatuses,
  toggleFavorite,
  setDanceListType,
  fetchUserDancesWithStatus,
} from '@/lib/api/userDanceStatus'
import type { UserDanceStatus } from '@/types/database'

export const USER_DANCE_STATUS_KEY = 'user_dance_status'
export const USER_DANCES_KEY = 'user_dances'

export function useUserDanceStatuses() {
  return useQuery({
    queryKey: [USER_DANCE_STATUS_KEY],
    queryFn: fetchUserDanceStatuses,
  })
}

export function useUserDances() {
  return useQuery({
    queryKey: [USER_DANCES_KEY],
    queryFn: fetchUserDancesWithStatus,
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (danceId) => {
      await qc.cancelQueries({ queryKey: [USER_DANCE_STATUS_KEY] })
      const prev = qc.getQueryData<UserDanceStatus[]>([USER_DANCE_STATUS_KEY])

      qc.setQueryData<UserDanceStatus[]>([USER_DANCE_STATUS_KEY], (old = []) => {
        const existing = old.find(s => s.dance_id === danceId)
        if (existing) {
          return old.map(s => s.dance_id === danceId ? { ...s, is_favorite: !s.is_favorite } : s)
        }
        return [...old, {
          id: `temp-${danceId}`,
          user_id: '',
          dance_id: danceId,
          is_favorite: true,
          list_type: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]
      })

      return { prev }
    },
    onError: (_err, _danceId, context) => {
      if (context?.prev) {
        qc.setQueryData([USER_DANCE_STATUS_KEY], context.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [USER_DANCE_STATUS_KEY] })
      qc.invalidateQueries({ queryKey: [USER_DANCES_KEY] })
    },
  })
}

export function useSetDanceListType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ danceId, listType }: { danceId: string; listType: 'already_learned' | 'learning' | 'plan_to_learn' | null }) =>
      setDanceListType(danceId, listType),
    onMutate: async ({ danceId, listType }) => {
      await qc.cancelQueries({ queryKey: [USER_DANCE_STATUS_KEY] })
      const prev = qc.getQueryData<UserDanceStatus[]>([USER_DANCE_STATUS_KEY])

      qc.setQueryData<UserDanceStatus[]>([USER_DANCE_STATUS_KEY], (old = []) => {
        const existing = old.find(s => s.dance_id === danceId)
        if (existing) {
          return old.map(s => s.dance_id === danceId ? { ...s, list_type: listType } : s)
        }
        return [...old, {
          id: `temp-${danceId}`,
          user_id: '',
          dance_id: danceId,
          is_favorite: false,
          list_type: listType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }]
      })

      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        qc.setQueryData([USER_DANCE_STATUS_KEY], context.prev)
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: [USER_DANCE_STATUS_KEY] })
      qc.invalidateQueries({ queryKey: [USER_DANCES_KEY] })
    },
  })
}
