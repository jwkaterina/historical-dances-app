import { supabase } from '@/lib/supabase'
import type { Dance, DanceWithDetails } from '@/types/database'

export async function fetchDances(search?: string): Promise<Dance[]> {
  let query = supabase
    .from('dances')
    .select('id, name, name_de, name_ru, difficulty, origin, created_at')
    .order('name', { ascending: true })

  if (search && search.trim()) {
    const term = `%${search.trim()}%`
    query = query.or(`name.ilike.${term},name_de.ilike.${term},name_ru.ilike.${term}`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map((d: any) => ({
    ...d,
    difficulty: d.difficulty ? d.difficulty.toLowerCase() : null,
  })) as Dance[]
}

export async function fetchDanceById(id: string): Promise<DanceWithDetails | null> {
  const { data, error } = await supabase
    .from('dances')
    .select(`
      id, name, name_de, name_ru,
      description, description_de, description_ru,
      scheme, scheme_de, scheme_ru,
      difficulty, origin, created_at,
      dance_videos ( id, video_type, url, order_index ),
      dance_figures (
        id, scheme_de, scheme_ru, order_index,
        figure_videos: figure_videos ( id, video_type, url, order_index )
      ),
      dance_music (
        music: music_id ( id, title, artist, tempo, genre, audio_url )
      )
    `)
    .eq('id', id)
    .single()

  if (error) return null
  const d = data as any
  return { ...d, difficulty: d.difficulty ? d.difficulty.toLowerCase() : null } as unknown as DanceWithDetails
}

export async function createDance(danceData: Partial<Dance>): Promise<Dance> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('dances')
    .insert(danceData)
    .select()
    .single()

  if (error) throw error
  return data as Dance
}

export async function updateDance(id: string, danceData: Partial<Dance>): Promise<void> {
  const { error } = await supabase
    .from('dances')
    .update(danceData)
    .eq('id', id)

  if (error) throw error
}

export async function deleteDance(id: string): Promise<{ success: boolean; code?: string; message?: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if dance is used in ball sections
  const { data: refs } = await supabase
    .from('ball_sections')
    .select('id, ball_id, balls:ball_id ( name ), section_dances!inner ( dance_id )')
    .eq('section_dances.dance_id', id)

  if (refs && refs.length > 0) {
    const ballNames = Array.from(new Set((refs as any[]).map(r => (r.balls as any)?.name).filter(Boolean)))
    return {
      success: false,
      code: 'DANCE_IN_BALLS',
      message: `Dance is used in: ${ballNames.join(', ')}`,
    }
  }

  // Collect music IDs
  const { data: musicLinks } = await supabase
    .from('dance_music')
    .select('music_id')
    .eq('dance_id', id)

  // Delete music links
  await supabase.from('dance_music').delete().eq('dance_id', id)

  // Delete dance
  const { error } = await supabase.from('dances').delete().eq('id', id)
  if (error) throw error

  // Try to clean up orphan music
  if (musicLinks && musicLinks.length > 0) {
    const musicIds = musicLinks.map((l: any) => l.music_id)
    const { data: remainingLinks } = await supabase
      .from('dance_music')
      .select('music_id')
      .in('music_id', musicIds)
    const stillUsed = new Set((remainingLinks || []).map((r: any) => r.music_id))
    const toDelete = musicIds.filter((mid: string) => !stillUsed.has(mid))
    if (toDelete.length > 0) {
      await supabase.from('music').delete().in('id', toDelete)
    }
  }

  return { success: true }
}

export async function syncDanceFigures(
  danceId: string,
  figures: Array<{ scheme_de: string; scheme_ru: string; videoType?: string; videoUrl?: string }>
): Promise<void> {
  await supabase.from('dance_figures').delete().eq('dance_id', danceId)
  for (let i = 0; i < figures.length; i++) {
    const f = figures[i]
    const { data: fig, error } = await supabase
      .from('dance_figures')
      .insert({ dance_id: danceId, scheme_de: f.scheme_de || null, scheme_ru: f.scheme_ru || null, order_index: i })
      .select('id')
      .single()
    if (error) throw error
    if (fig && f.videoUrl?.trim()) {
      await supabase.from('figure_videos').insert({
        figure_id: fig.id, video_type: f.videoType ?? 'youtube', url: f.videoUrl.trim(), order_index: 0,
      })
    }
  }
}

export async function syncDanceVideos(danceId: string, videos: Array<{ id?: string; video_type: string; url: string }>) {
  const { data: existing } = await supabase
    .from('dance_videos')
    .select('id')
    .eq('dance_id', danceId)

  const existingIds = new Set((existing || []).map((v: any) => v.id))
  const submittedIds = new Set(videos.map(v => v.id).filter(Boolean) as string[])
  const toDelete = Array.from(existingIds).filter(id => !submittedIds.has(id))

  if (toDelete.length > 0) {
    await supabase.from('dance_videos').delete().in('id', toDelete)
  }

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i]
    if (v.id) {
      await supabase.from('dance_videos').update({ video_type: v.video_type, url: v.url, order_index: i }).eq('id', v.id)
    } else {
      await supabase.from('dance_videos').insert({ dance_id: danceId, video_type: v.video_type, url: v.url, order_index: i })
    }
  }
}

export async function fetchDanceTutorials(danceId: string): Promise<string[]> {
  const { data } = await supabase
    .from('dance_tutorials')
    .select('tutorial_id')
    .eq('dance_id', danceId)
  return (data ?? []).map((r: any) => r.tutorial_id)
}

export async function syncDanceTutorials(danceId: string, tutorialIds: string[]): Promise<void> {
  const { data: existing } = await supabase
    .from('dance_tutorials')
    .select('tutorial_id')
    .eq('dance_id', danceId)

  const currentIds = new Set((existing || []).map((r: any) => r.tutorial_id))
  const targetIds = new Set(tutorialIds)

  const toDelete = Array.from(currentIds).filter(id => !targetIds.has(id))
  const toAdd = tutorialIds.filter(id => !currentIds.has(id))

  if (toDelete.length > 0) {
    await supabase.from('dance_tutorials').delete().eq('dance_id', danceId).in('tutorial_id', toDelete)
  }
  for (const tutorialId of toAdd) {
    await supabase.from('dance_tutorials').insert({ dance_id: danceId, tutorial_id: tutorialId })
  }
}

export async function syncDanceMusicLinks(danceId: string, musicIds: string[]) {
  const { data: existing } = await supabase
    .from('dance_music')
    .select('music_id')
    .eq('dance_id', danceId)

  const currentIds = new Set((existing || []).map((l: any) => l.music_id))
  const targetIds = new Set(musicIds)

  const toDelete = Array.from(currentIds).filter(id => !targetIds.has(id))
  const toAdd = musicIds.filter(id => !currentIds.has(id))

  if (toDelete.length > 0) {
    await supabase.from('dance_music').delete().eq('dance_id', danceId).in('music_id', toDelete)
  }
  for (const mid of toAdd) {
    await supabase.from('dance_music').insert({ dance_id: danceId, music_id: mid })
  }
}
