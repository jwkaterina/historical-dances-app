import { supabase } from '@/lib/supabase'
import type { MusicTrack } from '@/types/database'

export async function fetchMusic(search?: string): Promise<MusicTrack[]> {
  let query = supabase
    .from('music')
    .select('id, title, artist, tempo, genre, audio_url, created_at')
    .order('title', { ascending: true })

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`title.ilike.${term},artist.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as MusicTrack[]
}

export async function createMusicTrack(track: Partial<MusicTrack>): Promise<MusicTrack> {
  const { data, error } = await supabase
    .from('music')
    .insert(track)
    .select()
    .single()

  if (error) throw error
  return data as MusicTrack
}

export async function updateMusicTrack(id: string, track: Partial<MusicTrack>): Promise<void> {
  const { error } = await supabase.from('music').update(track).eq('id', id)
  if (error) throw error
}
