import { supabase } from '@/lib/supabase'
import type { Tutorial, TutorialCategory } from '@/types/database'

export async function fetchTutorials(): Promise<Tutorial[]> {
  const { data, error } = await supabase
    .from('tutorials')
    .select('*, tutorial_categories(id, name_de, name_ru)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchTutorialById(id: string): Promise<Tutorial | null> {
  const { data, error } = await supabase
    .from('tutorials')
    .select('*, tutorial_categories(id, name_de, name_ru)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchTutorialCategories(): Promise<TutorialCategory[]> {
  const { data, error } = await supabase
    .from('tutorial_categories')
    .select('*')
    .order('name_de')
  if (error) throw error
  return data ?? []
}
