import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchBallPartners, saveBallPartner } from '@/lib/api/ballPartners'

export const BALL_PARTNERS_KEY = 'ball_partners'

export function useBallPartners(ballId: string) {
  return useQuery({
    queryKey: [BALL_PARTNERS_KEY, ballId],
    queryFn: () => fetchBallPartners(ballId),
    enabled: !!ballId,
  })
}

export function useSaveBallPartner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ ballId, sectionDanceId, partnerName }: { ballId: string; sectionDanceId: string; partnerName: string }) =>
      saveBallPartner(ballId, sectionDanceId, partnerName),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [BALL_PARTNERS_KEY, vars.ballId] })
    },
  })
}
