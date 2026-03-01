import { supabase } from '@/lib/supabase'

export async function uploadFile(
  bucket: string,
  path: string,
  uri: string,
  mimeType: string,
): Promise<string> {
  const response = await fetch(uri)
  const blob = await response.blob()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType: mimeType, upsert: true })

  if (error) throw error

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

export function generateFileName(prefix: string, ext: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${random}.${ext}`
}
