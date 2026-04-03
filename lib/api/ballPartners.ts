import { supabase } from '@/lib/supabase'
import type { BallPartner } from '@/types/database'

export async function fetchBallPartners(ballId: string): Promise<BallPartner[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('ball_partners')
    .select('id, ball_id, section_dance_id, user_id, partner_name')
    .eq('ball_id', ballId)
    .eq('user_id', user.id)

  if (error) throw error
  return (data ?? []) as BallPartner[]
}

export async function upsertBallPartners(
  ballId: string,
  partners: { section_dance_id: string; partner_name: string }[]
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const toDelete = partners.filter(p => !p.partner_name.trim())
  const toUpsert = partners.filter(p => p.partner_name.trim())

  if (toDelete.length > 0) {
    const deleteIds = toDelete.map(p => p.section_dance_id)
    await supabase
      .from('ball_partners')
      .delete()
      .eq('ball_id', ballId)
      .eq('user_id', user.id)
      .in('section_dance_id', deleteIds)
  }

  if (toUpsert.length > 0) {
    const rows = toUpsert.map(p => ({
      ball_id: ballId,
      section_dance_id: p.section_dance_id,
      user_id: user.id,
      partner_name: p.partner_name.trim(),
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('ball_partners')
      .upsert(rows, { onConflict: 'ball_id,section_dance_id,user_id' })

    if (error) throw error
  }
}
