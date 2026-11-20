import { supabase } from './supabase'

/**
 * Upload a photo to the public-media bucket.
 *
 * The image is redrawn on a canvas and re-encoded as JPEG before upload.
 * That strips EXIF metadata — including GPS coordinates that phone photos
 * often carry (which could reveal where someone lives) — and downsizes it to
 * at most 1600px on the long edge.
 */
const MAX_EDGE = 1600

export async function uploadPhoto(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('unsupported_type')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas_unavailable')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('encode_failed'))), 'image/jpeg', 0.85),
  )
  const path = `reports/${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('public-media').upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return supabase.storage.from('public-media').getPublicUrl(path).data.publicUrl
}
