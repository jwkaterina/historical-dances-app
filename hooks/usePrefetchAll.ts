import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Dance, BallWithSections } from '@/types/database'
import { fetchDances, fetchDanceById, fetchDanceTutorials } from '@/lib/api/dances'
import { fetchBalls, fetchBallById, fetchDancesForBall } from '@/lib/api/balls'
import { fetchMusic } from '@/lib/api/music'
import { fetchTutorials, fetchTutorialCategories } from '@/lib/api/tutorials'
import { DANCES_KEY } from '@/hooks/useDances'
import { BALLS_KEY, DANCES_FOR_BALL_KEY } from '@/hooks/useBalls'
import { MUSIC_KEY } from '@/hooks/useMusic'
import { TUTORIALS_KEY, TUTORIAL_CATEGORIES_KEY } from '@/hooks/useTutorials'

const PREFETCH_OPTS = { retry: false } as const

export function usePrefetchAll() {
  const qc = useQueryClient()

  useEffect(() => {
    const run = async () => {
      // Step 1: prefetch all lists (retry:false so offline failures are instant + silent)
      await Promise.all([
        qc.prefetchQuery({ queryKey: [DANCES_KEY, undefined], queryFn: () => fetchDances(), ...PREFETCH_OPTS }),
        qc.prefetchQuery({ queryKey: [BALLS_KEY], queryFn: fetchBalls, ...PREFETCH_OPTS }),
        qc.prefetchQuery({ queryKey: [MUSIC_KEY], queryFn: fetchMusic, ...PREFETCH_OPTS }),
        qc.prefetchQuery({ queryKey: [TUTORIALS_KEY], queryFn: fetchTutorials, ...PREFETCH_OPTS }),
        qc.prefetchQuery({ queryKey: [TUTORIAL_CATEGORIES_KEY], queryFn: fetchTutorialCategories, ...PREFETCH_OPTS }),
        qc.prefetchQuery({ queryKey: [DANCES_FOR_BALL_KEY], queryFn: fetchDancesForBall, ...PREFETCH_OPTS }),
      ])

      // Step 2: read lists from cache to get IDs for detail prefetches
      const dances = qc.getQueryData<Dance[]>([DANCES_KEY, undefined]) ?? []
      const balls = qc.getQueryData<BallWithSections[]>([BALLS_KEY]) ?? []

      // Step 3: prefetch all detail pages (fire-and-forget, no await)
      dances.forEach(d => {
        qc.prefetchQuery({ queryKey: [DANCES_KEY, d.id], queryFn: () => fetchDanceById(d.id), ...PREFETCH_OPTS })
        qc.prefetchQuery({ queryKey: ['dance_tutorials', d.id], queryFn: () => fetchDanceTutorials(d.id), ...PREFETCH_OPTS })
      })
      balls.forEach(b => {
        qc.prefetchQuery({ queryKey: [BALLS_KEY, b.id], queryFn: () => fetchBallById(b.id), ...PREFETCH_OPTS })
      })
    }

    run().catch(() => {}) // explicit catch so unhandled rejection never escapes
  }, [qc])
}
