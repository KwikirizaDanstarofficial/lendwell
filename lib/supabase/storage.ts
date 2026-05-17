import { supabase } from './client'

export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  AVATARS: 'avatars',
  LOGOS: 'logos',
} as const

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS]

export class SupabaseStorage {
  static async uploadFile(
    bucket: StorageBucket,
    file: File,
    path: string,
    options?: {
      upsert?: boolean
    }
  ) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: options?.upsert ?? false,
      })

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    return data
  }

  static async getPublicUrl(bucket: StorageBucket, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    return data.publicUrl
  }

  static async deleteFile(bucket: StorageBucket, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  }

  static async listFiles(bucket: StorageBucket, path?: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path)

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`)
    }

    return data
  }
}