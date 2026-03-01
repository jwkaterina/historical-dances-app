import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBalls, fetchBallById, createBall, updateBall, deleteBall, fetchDancesForBall, BallFormData } from '@/lib/api/balls'

export const BALLS_KEY = 'balls'
export const DANCES_FOR_BALL_KEY = 'dances_for_ball'

export function useBalls() {
  return useQuery({
    queryKey: [BALLS_KEY],
    queryFn: fetchBalls,
  })
}

export function useBall(id: string) {
  return useQuery({
    queryKey: [BALLS_KEY, id],
    queryFn: () => fetchBallById(id),
    enabled: !!id,
  })
}

export function useDancesForBall() {
  return useQuery({
    queryKey: [DANCES_FOR_BALL_KEY],
    queryFn: fetchDancesForBall,
  })
}

export function useCreateBall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createBall,
    onSuccess: () => qc.invalidateQueries({ queryKey: [BALLS_KEY] }),
  })
}

export function useUpdateBall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BallFormData }) => updateBall(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [BALLS_KEY] })
      qc.invalidateQueries({ queryKey: [BALLS_KEY, vars.id] })
    },
  })
}

export function useDeleteBall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteBall,
    onSuccess: () => qc.invalidateQueries({ queryKey: [BALLS_KEY] }),
  })
}
