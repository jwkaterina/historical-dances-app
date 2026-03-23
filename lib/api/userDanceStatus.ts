import { supabase } from '@/lib/supabase'
import type { UserDanceStatus } from '@/types/database'

export async function fetchUserDanceStatuses(): Promise<UserDanceStatus[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_dance_status')
    .select('*')
    .eq('user_id', user.id)

  if (error) throw error
  return (data ?? []) as UserDanceStatus[]
}

export async function toggleFavorite(danceId: string): Promise<UserDanceStatus> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check existing
  const { data: existing } = await supabase
    .from('user_dance_status')
    .select('*')
    .eq('user_id', user.id)
    .eq('dance_id', danceId)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('user_dance_status')
      .update({ is_favorite: !existing.is_favorite, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data as UserDanceStatus
  }

  const { data, error } = await supabase
    .from('user_dance_status')
    .insert({ user_id: user.id, dance_id: danceId, is_favorite: true })
    .select()
    .single()
  if (error) throw error
  return data as UserDanceStatus
}

export async function setDanceListType(
  danceId: string,
  listType: 'already_learned' | 'learning' | 'plan_to_learn' | null
): Promise<UserDanceStatus> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: existing } = await supabase
    .from('user_dance_status')
    .select('*')
    .eq('user_id', user.id)
    .eq('dance_id', danceId)
    .single()

  if (existing) {
    const { data, error } = await supabase
      .from('user_dance_status')
      .update({ list_type: listType, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data as UserDanceStatus
  }

  const { data, error } = await supabase
    .from('user_dance_status')
    .insert({ user_id: user.id, dance_id: danceId, list_type: listType })
    .select()
    .single()
  if (error) throw error
  return data as UserDanceStatus
}

export async function fetchUserDancesWithStatus(): Promise<
  Array<{ id: string; name: string; name_de: string | null; name_ru: string | null; description: string | null; description_de: string | null; description_ru: string | null; difficulty: string | null; origin: string | null; is_favorite: boolean; list_type: string | null }>
> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_dance_status')
    .select('dance_id, is_favorite, list_type, dances:dance_id ( id, name, name_de, name_ru, description, description_de, description_ru, difficulty, origin )')
    .eq('user_id', user.id)
    .or('is_favorite.eq.true,list_type.not.is.null')

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.dances.id,
    name: row.dances.name,
    name_de: row.dances.name_de,
    name_ru: row.dances.name_ru,
    description: row.dances.description,
    description_de: row.dances.description_de,
    description_ru: row.dances.description_ru,
    difficulty: row.dances.difficulty ? row.dances.difficulty.toLowerCase() : null,
    origin: row.dances.origin,
    is_favorite: row.is_favorite,
    list_type: row.list_type,
  }))
}
