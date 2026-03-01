import { useQuery } from '@tanstack/react-query'
import { fetchTutorials, fetchTutorialById, fetchTutorialCategories } from '@/lib/api/tutorials'

export const TUTORIALS_KEY = 'tutorials'
export const TUTORIAL_CATEGORIES_KEY = 'tutorial_categories'

export function useTutorials() {
  return useQuery({
    queryKey: [TUTORIALS_KEY],
    queryFn: fetchTutorials,
  })
}

export function useTutorial(id: string) {
  return useQuery({
    queryKey: [TUTORIALS_KEY, id],
    queryFn: () => fetchTutorialById(id),
    enabled: !!id,
  })
}

export function useTutorialCategories() {
  return useQuery({
    queryKey: [TUTORIAL_CATEGORIES_KEY],
    queryFn: fetchTutorialCategories,
  })
}
