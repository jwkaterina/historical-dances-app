import { supabase } from '@/lib/supabase'
import type { Ball, BallWithSections, SectionFormData } from '@/types/database'

const BALL_SELECT = `
  id, name, name_de, name_ru, date, place, place_de, place_ru,
  info_de, info_ru, created_at, user_id,
  ball_sections (
    id, name, name_de, name_ru, order_index,
    section_dances (
      id, order_index, dance_id, music_ids,
      dances:dance_id ( id, name, name_de, name_ru, difficulty )
    ),
    section_texts (
      id, order_index, content_de, content_ru
    )
  )
`

export async function fetchBalls(): Promise<BallWithSections[]> {
  const { data, error } = await supabase
    .from('balls')
    .select(BALL_SELECT)
    .order('date', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as BallWithSections[]
}

export async function fetchBallById(id: string): Promise<BallWithSections | null> {
  const { data, error } = await supabase
    .from('balls')
    .select(BALL_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as BallWithSections
}

export interface BallFormData {
  name_de: string
  name_ru: string
  date: string
  place_de: string
  place_ru: string
  info_de?: string
  info_ru?: string
  sections: SectionFormData[]
}

export async function createBall(formData: BallFormData): Promise<Ball> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: ball, error: ballError } = await supabase
    .from('balls')
    .insert({
      name: formData.name_de,
      name_de: formData.name_de,
      name_ru: formData.name_ru,
      date: formData.date,
      place: formData.place_de,
      place_de: formData.place_de,
      place_ru: formData.place_ru,
      info_de: formData.info_de ?? null,
      info_ru: formData.info_ru ?? null,
      user_id: user.id,
    })
    .select()
    .single()

  if (ballError) throw ballError

  await insertSections(ball.id, formData.sections)
  return ball as Ball
}

export async function updateBall(id: string, formData: BallFormData): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error: ballError } = await supabase
    .from('balls')
    .update({
      name: formData.name_de,
      name_de: formData.name_de,
      name_ru: formData.name_ru,
      date: formData.date,
      place: formData.place_de,
      place_de: formData.place_de,
      place_ru: formData.place_ru,
      info_de: formData.info_de ?? null,
      info_ru: formData.info_ru ?? null,
    })
    .eq('id', id)

  if (ballError) throw ballError

  // Delete existing sections (cascade)
  const { data: existingSections } = await supabase
    .from('ball_sections')
    .select('id')
    .eq('ball_id', id)

  const sectionIds = (existingSections || []).map((s: any) => s.id)
  if (sectionIds.length > 0) {
    await supabase.from('section_texts').delete().in('section_id', sectionIds)
    await supabase.from('section_dances').delete().in('section_id', sectionIds)
  }
  await supabase.from('ball_sections').delete().eq('ball_id', id)

  await insertSections(id, formData.sections)
}

async function insertSections(ballId: string, sections: SectionFormData[]) {
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const section = sections[sIdx]
    const { data: sectionData, error: sectionError } = await supabase
      .from('ball_sections')
      .insert({
        ball_id: ballId,
        order_index: sIdx,
        name: section.name_de,
        name_de: section.name_de,
        name_ru: section.name_ru,
      })
      .select()
      .single()

    if (sectionError) throw sectionError

    const entries = [...(section.entries || [])].sort((a, b) => a.order_index - b.order_index)

    const dancesToInsert = entries
      .filter(e => e.kind === 'dance')
      .map(e => ({
        section_id: sectionData.id,
        order_index: e.order_index,
        dance_id: (e as any).danceId,
        music_ids: (e as any).musicIds ?? [],
      }))

    if (dancesToInsert.length > 0) {
      const { error } = await supabase.from('section_dances').insert(dancesToInsert)
      if (error) throw error
    }

    const textsToInsert = entries
      .filter(e => e.kind === 'text')
      .map(e => ({
        section_id: sectionData.id,
        order_index: e.order_index,
        content_de: (e as any).content_de ?? '',
        content_ru: (e as any).content_ru ?? '',
      }))

    if (textsToInsert.length > 0) {
      const { error } = await supabase.from('section_texts').insert(textsToInsert)
      if (error) throw error
    }
  }
}

export async function deleteBall(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('balls').delete().eq('id', id)
  if (error) throw error
}

export async function fetchDancesForBall() {
  const { data, error } = await supabase
    .from('dances')
    .select(`
      id, name, name_de, name_ru, difficulty,
      dance_music (
        music:music_id ( id, title, artist, audio_url )
      )
    `)
    .order('name', { ascending: true })

  if (error) throw error
  return (data || []).map((dance: any) => ({
    ...dance,
    musicTracks: dance.dance_music?.map((dm: any) => dm.music).filter((m: any) => m?.audio_url) ?? [],
  }))
}
