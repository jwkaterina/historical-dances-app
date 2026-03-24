import { supabase } from '@/lib/supabase'
import type { Faq } from '@/types/database'

export async function fetchFaqs(): Promise<Faq[]> {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) throw error
  return (data ?? []) as Faq[]
}
