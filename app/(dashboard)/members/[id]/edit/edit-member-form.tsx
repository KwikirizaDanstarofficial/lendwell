"use client"

import { useActionState, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import {
  editMemberAction,
  deleteMemberAction,
  MemberFormState,
} from "../../actions"
type Member = {
  id: string
  saccoId: string
  memberCode: string
  fullName: string
  email: string | null
  phone: string | null
  nationalId: string | null
  photoUrl: string | null
  dateOfBirth: string | null
  address: string | null
  nextOfKin: string | null
  nextOfKinPhone: string | null
  nextOfKinRelationship: string | null
  nextOfKinAddress: string | null
  status: string
  joinedAt: Date
  createdAt: Date
  updatedAt: Date
}
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Camera, Loader2, ArrowLeft, User, Upload, Trash2 } from "lucide-react"

interface EditMemberFormProps {
  member: Member
}

const initialState: MemberFormState = {}

function SectionHeader({
  step,
  title,
  description,
}: {
  step: number
  title: string
  description?: string
}) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold tracking-wide text-primary-foreground">
        {step}
      </div>
      <div>
        <h3 className="text-sm font-semibold tracking-widest text-foreground uppercase">
          {title}
        </h3>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
      {children}
    </div>
  )
}

function Field({
  id,
  label,
  required,
  error,
  span,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  span?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${span ? "sm:col-span-2" : ""}`}>
      <label
        htmlFor={id}
        className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
          <span className="inline-block h-1 w-1 rounded-full bg-destructive" />
          {error}
        </p>
      )}
    </div>
  )
}

const inputClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"

export function EditMemberForm({ member }: EditMemberFormProps) {
  const router = useRouter()
  const [photoPreview, setPhotoPreview] = useState(member.photoUrl ?? "")
  const [photoUrl, setPhotoUrl] = useState(member.photoUrl ?? "")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update hidden file input when photoFile changes
  useEffect(() => {
    if (fileInputRef.current && photoFile) {
      const dt = new DataTransfer()
      dt.items.add(photoFile)
      fileInputRef.current.files = dt.files
    }
  }, [photoFile])

  const boundAction = editMemberAction.bind(null, member.id)
  const [state, formAction, isPending] = useActionState(
    boundAction,
    initialState
  )

  useEffect(() => {
    if (state.success) {
      toast.success("Member updated successfully!")
      setUploading(false)
      setUploadProgress(100)
      router.push("/members")
    }
    if (state.error) {
      toast.error(state.error)
      setUploading(false)
      setUploadProgress(0)
    }
  }, [state, router])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (files, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        if (rejection.errors.some((e) => e.code === "file-too-large")) {
          toast.error("Image must be less than 5MB")
        } else if (
          rejection.errors.some((e) => e.code === "file-invalid-type")
        ) {
          toast.error("Only JPG, PNG, and WEBP images are allowed")
        } else {
          toast.error("Invalid file")
        }
        return
      }

      const file = files[0]
      if (!file) return

      const preview = URL.createObjectURL(file)
      setPhotoPreview(preview)
      setPhotoUrl(preview)
      setPhotoFile(file)
      setImageError(false)
      toast.success("Photo updated successfully!")
    },
  })

  const handleDelete = async () => {
    setDeleting(true)
    const res = await deleteMemberAction(member.id)
    setDeleting(false)
    if (res.success) {
      toast.success("Member removed successfully")
      router.push("/members")
    } else {
      toast.error(res.error)
    }
  }

  const fieldError = (field: string) => state.fieldErrors?.[field]?.[0]

  return (
    <form action={formAction} className="mx-auto max-w-2xl">
      <input type="hidden" name="photo_url" value={photoUrl} />
      <input
        type="file"
        name="photo"
        style={{ display: "none" }}
        ref={fileInputRef}
      />

      {/* ── Section 1: Photo ── */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader
          step={1}
          title="Profile Photo"
          description="Upload a clear, recent photo of the member."
        />

        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-muted shadow-inner">
              {uploading ? (
                <div className="flex flex-col items-center gap-1">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">
                    {uploadProgress}%
                  </p>
                </div>
              ) : photoPreview && !imageError ? (
                <Image
                  src={photoPreview}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                  unoptimized
                  onError={() => setImageError(true)}
                />
              ) : (
                <User className="h-9 w-9 text-muted-foreground" />
              )}
            </div>
            {photoPreview && !uploading && (
              <div className="absolute -right-1.5 -bottom-1.5 rounded-full bg-primary p-1 shadow">
                <Camera className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>

          <div
            {...getRootProps()}
            className={`flex-1 cursor-pointer rounded-xl border-2 border-dashed px-5 py-4 transition-all ${
              isDragActive
                ? "border-ring bg-accent"
                : "border-border hover:border-ring/50 hover:bg-accent/50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                {isDragActive
                  ? "Drop your photo here"
                  : "Click or drag to change photo"}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG or WEBP • Max 5MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Personal Info ── */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader
          step={2}
          title="Personal Information"
          description="Update the member's basic contact and identity details."
        />

        <FieldGroup>
          <Field
            id="full_name"
            label="Full Name"
            required
            error={fieldError("full_name")}
            span
          >
            <Input
              id="full_name"
              name="full_name"
              defaultValue={member.fullName}
              placeholder="Enter full name"
              className={inputClass}
            />
          </Field>

          <Field
            id="phone"
            label="Phone Number"
            required
            error={fieldError("phone")}
          >
            <Input
              id="phone"
              name="phone"
              defaultValue={member.phone ?? ""}
              placeholder="07XX XXX XXX"
              className={inputClass}
            />
          </Field>

          <Field id="email" label="Email Address" error={fieldError("email")}>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={member.email ?? ""}
              placeholder="email@example.com"
              className={inputClass}
            />
          </Field>

          <Field
            id="national_id"
            label="National ID"
            required
            error={fieldError("national_id")}
          >
            <Input
              id="national_id"
              name="national_id"
              defaultValue={member.nationalId ?? ""}
              placeholder="CM XXXXXXXXXX"
              className={inputClass}
            />
          </Field>

          <Field id="date_of_birth" label="Date of Birth">
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={member.dateOfBirth ?? ""}
              className={inputClass}
            />
          </Field>

          <Field id="address" label="Physical Address" span>
            <Input
              id="address"
              name="address"
              defaultValue={member.address ?? ""}
              placeholder="Street, area or town"
              className={inputClass}
            />
          </Field>

          <Field id="status" label="Membership Status" span>
            <Select name="status" defaultValue={member.status}>
              <SelectTrigger className={`${inputClass} flex w-full`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                    Active
                  </span>
                </SelectItem>
                <SelectItem value="suspended">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" />
                    Suspended
                  </span>
                </SelectItem>
                <SelectItem value="exited">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    Exited
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </div>

      {/* ── Section 3: Next of Kin ── */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <SectionHeader
          step={3}
          title="Next of Kin"
          description="Optional emergency contact information."
        />

        <FieldGroup>
          <Field id="next_of_kin" label="Full Name">
            <Input
              id="next_of_kin"
              name="next_of_kin"
              defaultValue={member.nextOfKin ?? ""}
              placeholder="Next of kin name"
              className={inputClass}
            />
          </Field>
          <Field id="next_of_kin_relationship" label="Relationship">
            <Input
              id="next_of_kin_relationship"
              name="next_of_kin_relationship"
              defaultValue={member.nextOfKinRelationship ?? ""}
              placeholder="e.g. Spouse, Parent, Sibling"
              className={inputClass}
            />
          </Field>
          <Field id="next_of_kin_phone" label="Phone Number">
            <Input
              id="next_of_kin_phone"
              name="next_of_kin_phone"
              defaultValue={member.nextOfKinPhone ?? ""}
              placeholder="07XX XXX XXX"
              className={inputClass}
            />
          </Field>
          <Field id="next_of_kin_address" label="Address">
            <Input
              id="next_of_kin_address"
              name="next_of_kin_address"
              defaultValue={member.nextOfKinAddress ?? ""}
              placeholder="Next of kin address"
              className={inputClass}
            />
          </Field>
        </FieldGroup>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between pt-2 pb-8">
        {/* Delete with confirmation */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              disabled={deleting}
              className="flex items-center gap-2 text-sm text-destructive transition-colors hover:text-destructive/80 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete Member
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {member.fullName}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this member and all their
                associated data including loans, savings, fines, and
                transactions. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Delete Member
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </button>

          <Button
            type="submit"
            disabled={isPending}
            className="h-10 rounded-xl px-6 text-sm font-medium tracking-wide shadow-sm transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes →"
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
