import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBallPartners, upsertBallPartners } from '@/lib/api/ballPartners'

export const BALL_PARTNERS_KEY = 'ball_partners'

export function useBallPartners(ballId: string) {
  return useQuery({
    queryKey: [BALL_PARTNERS_KEY, ballId],
    queryFn: () => fetchBallPartners(ballId),
    enabled: !!ballId,
  })
}

export function useSaveBallPartners() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ballId, partners }: { ballId: string; partners: { section_dance_id: string; partner_name: string }[] }) =>
      upsertBallPartners(ballId, partners),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [BALL_PARTNERS_KEY, vars.ballId] })
    },
  })
}
