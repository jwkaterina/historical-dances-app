import { File as FSFile } from 'expo-file-system'
import { supabase } from '@/lib/supabase'

export async function uploadFile(
  bucket: string,
  path: string,
  uri: string,
  mimeType: string,
): Promise<string> {
  // expo-file-system v19 new API: File.bytes() works with content:// and file:// URIs
  const file = new FSFile(uri)
  const bytes = await file.bytes()

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType: mimeType, upsert: true })

  if (error) throw error

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

export function generateFileName(prefix: string, ext: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}_${timestamp}_${random}.${ext}`
}
