import { useQuery } from '@tanstack/react-query'
import { fetchFaqs } from '@/lib/api/faqs'

export const FAQS_KEY = 'faqs'

export function useFaqs() {
  return useQuery({
    queryKey: [FAQS_KEY],
    queryFn: fetchFaqs,
  })
}
