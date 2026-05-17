"use server"

import { getCurrentUser } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase/server"
import { SupabaseStorage, STORAGE_BUCKETS } from "@/lib/supabase/storage"
import { revalidatePath } from "next/cache"

export type DocumentFormState = {
  success?: boolean
  error?: string
  url?: string
}

export async function uploadDocumentAction(
  prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  try {
    const user = await getCurrentUser()
    if (!user) return { error: "Not authenticated." }

    

    const file = formData.get("file") as File
    const member_id = formData.get("member_id") as string
    const type = formData.get("type") as string
    const loan_id = formData.get("loan_id") as string | null

    if (!file || file.size === 0) return { error: "No file provided." }
    if (!member_id) return { error: "Please select a member." }
    if (!type) return { error: "Please select document type." }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) return { error: "File too large. Max 10MB." }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowed.includes(file.type)) {
      return { error: "Only JPG, PNG, WEBP, and PDF files are allowed." }
    }

    const ext = file.name.split(".").pop()
    const filename = `${user.saccoId}/${member_id}/${type}-${Date.now()}.${ext}`

    // Upload to Supabase Storage
    const uploadResult = await SupabaseStorage.uploadFile(
      STORAGE_BUCKETS.DOCUMENTS,
      file,
      filename
    )

    const publicUrl = await SupabaseStorage.getPublicUrl(STORAGE_BUCKETS.DOCUMENTS, filename)

    // Save document record to database
    const { error: insertError } = await supabaseAdmin
      .from('documents')
      .insert({
        sacco_id: user.saccoId,
        member_id,
        loan_id: loan_id || null,
        type: type as any,
        file_name: file.name,
        blob_url: publicUrl,
      })

    if (insertError) {
      // If database insert fails, try to clean up the uploaded file
      try {
        await SupabaseStorage.deleteFile(STORAGE_BUCKETS.DOCUMENTS, filename)
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError)
      }
      throw new Error(`Failed to save document: ${insertError.message}`)
    }

    revalidatePath("/documents")
    return { success: true, url: publicUrl }
  } catch (err) {
    console.error(err)
    return { error: "Failed to upload document." }
  }
}

export async function deleteDocumentAction(
  id: string,
  blobUrl: string
): Promise<DocumentFormState> {
  try {
    

    // Get the document to find the storage path
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('blob_url')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch document: ${fetchError.message}`)
    }

    // Extract the file path from the URL
    // Supabase public URL format: https://[project].supabaseAdmin.co/storage/v1/object/public/[bucket]/[path]
    const urlParts = document.blob_url.split('/storage/v1/object/public/documents/')
    const filePath = urlParts[1] // Get the path part after the bucket

    if (filePath) {
      // Delete from Supabase Storage
      await SupabaseStorage.deleteFile(STORAGE_BUCKETS.DOCUMENTS, filePath)
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw new Error(`Failed to delete document: ${deleteError.message}`)
    }

    revalidatePath("/documents")
    return { success: true }
  } catch (err) {
    console.error(err)
    return { error: "Failed to delete document." }
  }
}
