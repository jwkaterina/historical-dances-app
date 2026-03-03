import { supabase } from '@/lib/supabase'
import type { MusicTrack } from '@/types/database'

export async function fetchMusic(): Promise<MusicTrack[]> {
  const { data, error } = await supabase
    .from('music')
    .select('id, title, artist, tempo, genre, audio_url, created_at, dance_music ( dances:dance_id ( id, name_de, name_ru ) )')
    .order('title', { ascending: true })

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
