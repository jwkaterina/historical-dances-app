import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchTutorials, fetchTutorialById, fetchTutorialCategories,
  createTutorial, updateTutorial, deleteTutorial,
  createCategory, updateCategory, deleteCategory,
} from '@/lib/api/tutorials'

export const TUTORIALS_KEY = 'tutorials'
export const TUTORIAL_CATEGORIES_KEY = 'tutorial_categories'

export function useTutorials() {
  return useQuery({ queryKey: [TUTORIALS_KEY], queryFn: fetchTutorials })
}

export function useTutorial(id: string) {
  return useQuery({
    queryKey: [TUTORIALS_KEY, id],
    queryFn: () => fetchTutorialById(id),
    enabled: !!id,
  })
}

export function useTutorialCategories() {
  return useQuery({ queryKey: [TUTORIAL_CATEGORIES_KEY], queryFn: fetchTutorialCategories })
}

export function useCreateTutorial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTutorial,
    onSuccess: () => qc.invalidateQueries({ queryKey: [TUTORIALS_KEY] }),
  })
}

export function useUpdateTutorial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTutorial>[1] }) =>
      updateTutorial(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TUTORIALS_KEY] }),
  })
}

export function useDeleteTutorial() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTutorial,
    onSuccess: () => qc.invalidateQueries({ queryKey: [TUTORIALS_KEY] }),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: [TUTORIAL_CATEGORIES_KEY] }),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name_de: string; name_ru: string } }) =>
      updateCategory(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TUTORIAL_CATEGORIES_KEY] }),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: [TUTORIAL_CATEGORIES_KEY] }),
  })
}
