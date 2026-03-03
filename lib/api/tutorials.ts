import { supabase } from '@/lib/supabase'
import type { Tutorial, TutorialCategory } from '@/types/database'

const SELECT = '*, tutorial_categories(id, name_de, name_ru)'

export async function fetchTutorials(): Promise<Tutorial[]> {
  const { data, error } = await supabase
    .from('tutorials')
    .select(SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchTutorialById(id: string): Promise<Tutorial | null> {
  const { data, error } = await supabase
    .from('tutorials')
    .select(SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createTutorial(data: {
  title_de: string
  title_ru: string
  type: string
  video_type?: string | null
  url: string
  category_id?: string | null
}): Promise<Tutorial> {
  const { data: result, error } = await supabase
    .from('tutorials')
    .insert(data)
    .select(SELECT)
    .single()
  if (error) throw error
  return result as Tutorial
}

export async function updateTutorial(id: string, data: {
  title_de: string
  title_ru: string
  type: string
  video_type?: string | null
  url: string
  category_id?: string | null
}): Promise<void> {
  const { error } = await supabase.from('tutorials').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteTutorial(id: string): Promise<void> {
  const { error } = await supabase.from('tutorials').delete().eq('id', id)
  if (error) throw error
}

export async function fetchTutorialCategories(): Promise<TutorialCategory[]> {
  const { data, error } = await supabase
    .from('tutorial_categories')
    .select('*')
    .order('name_de')
  if (error) throw error
  return data ?? []
}

export async function createCategory(data: { name_de: string; name_ru: string }): Promise<TutorialCategory> {
  const { data: result, error } = await supabase
    .from('tutorial_categories')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return result as TutorialCategory
}

export async function updateCategory(id: string, data: { name_de: string; name_ru: string }): Promise<void> {
  const { error } = await supabase.from('tutorial_categories').update(data).eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('tutorial_categories').delete().eq('id', id)
  if (error) throw error
}
