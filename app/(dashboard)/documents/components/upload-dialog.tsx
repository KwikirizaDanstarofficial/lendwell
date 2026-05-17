"use client"

import { useActionState, useState, useEffect, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { uploadDocumentAction, DocumentFormState } from "../actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, FileText, Image, X, Loader2, CheckCircle } from "lucide-react"

const initialState: DocumentFormState = {}

const docTypes = [
  { value: "national_id", label: "National ID" },
  { value: "registration_form", label: "Registration Form" },
  { value: "loan_contract", label: "Loan Contract" },
  { value: "membership_certificate", label: "Membership Certificate" },
  { value: "other", label: "Other" },
]

interface UploadDialogProps {
  open: boolean
  onClose: () => void
  members: { id: string; full_name: string; member_code: string }[]
  defaultMemberId?: string
}

export function UploadDialog({
  open,
  onClose,
  members,
  defaultMemberId,
}: UploadDialogProps) {
  const [state, formAction, isPending] = useActionState(
    uploadDocumentAction,
    initialState
  )
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [memberId, setMemberId] = useState(defaultMemberId ?? "")
  const [docType, setDocType] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const onCloseRef = useRef(onClose)

  // Update ref when onClose changes
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (state.success) {
      toast.success("Document uploaded successfully!")
      setSelectedFile(null)
      setPreview(null)
      setDocType("")
      onCloseRef.current()
    }
    if (state.error) toast.error(state.error)
  }, [state])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setSelectedFile(file)
    if (file.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "application/pdf": [".pdf"],
    },
  })

  const handleSubmit = (formData: FormData) => {
    if (!selectedFile) {
      toast.error("Please select a file")
      return
    }
    formData.append("file", selectedFile)
    formData.append("member_id", memberId)
    formData.append("type", docType)
    formAction(formData)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload PDFs or images. Max file size 10MB.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {/* Member Select */}
          <div className="space-y-1.5">
            <Label>Member *</Label>
            <Select
              value={memberId}
              onValueChange={(value) => setMemberId(value ?? "")}
              name="member_id"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name} · {m.member_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Type */}
          <div className="space-y-1.5">
            <Label>Document Type *</Label>
            <Select
              value={docType}
              onValueChange={(value) => setDocType(value ?? "")}
              name="type"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Dropzone */}
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary hover:bg-muted/30"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-50" />
              <p className="text-sm font-medium">
                {isDragActive
                  ? "Drop your file here"
                  : "Drag & drop or click to browse"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, JPG, PNG, WEBP · Max 10MB
              </p>
            </div>
          ) : (
            <div className="w-full rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                {/* File Preview */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  {preview ? (
                    <img
                      src={preview}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileText className="h-8 w-8 text-muted-foreground opacity-60" />
                  )}
                </div>

                {/* File Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium break-all">
                    {selectedFile.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)} ·{" "}
                    {selectedFile.type.split("/")[1].toUpperCase()}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Ready to upload
                  </div>
                </div>

                {/* Remove */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreview(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedFile || !memberId || !docType}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
