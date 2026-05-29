// app/(dashboard)/settings/components/general-tab.tsx
// Settings tab for SACCO branding: logo upload, name, contact info, and brand colour.
"use client"

import { useActionState, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { toast } from "sonner"
import {
  updateGeneralSettingsAction,
  uploadLogoAction,
  SettingsState,
} from "../actions"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Upload, Building2 } from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum logo file size accepted by the dropzone (2 MB). */
const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024

/** Accepted MIME types for the logo dropzone. */
const LOGO_ACCEPTED_TYPES = {
  "image/jpeg":   [".jpg", ".jpeg"],
  "image/png":    [".png"],
  "image/webp":   [".webp"],
  "image/svg+xml": [".svg"],
} as const

/** Default brand colour used when the SACCO has no saved colour. */
const DEFAULT_BRAND_COLOR = "#16a34a"

/** Progress bar increment per tick during the upload simulation. */
const PROGRESS_INCREMENT = 10

/** Tick interval in ms for the progress bar simulation. */
const PROGRESS_TICK_MS = 100

/** Delay in ms before clearing the progress state after upload completes. */
const PROGRESS_CLEAR_DELAY_MS = 500

const INITIAL_STATE: SettingsState = {}

export function GeneralTab({ sacco }: { sacco: any }) {
  const [state, formAction, isPending] = useActionState(
    updateGeneralSettingsAction,
    INITIAL_STATE
  )
  const [name,         setName]         = useState(sacco?.name         ?? "")
  const [contactEmail, setContactEmail] = useState(sacco?.contactEmail ?? "")
  const [contactPhone, setContactPhone] = useState(sacco?.contactPhone ?? "")
  const [address,      setAddress]      = useState(sacco?.address      ?? "")
  const [tagline,      setTagline]      = useState(sacco?.tagline       ?? "")
  const [color,        setColor]        = useState(sacco?.primaryColor  ?? DEFAULT_BRAND_COLOR)
  const [logoUrl, setLogoUrl] = useState(sacco?.logoUrl ?? "")
  const [localPreview, setLocalPreview] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    if (state.success) toast.success("Settings saved successfully!")
    if (state.error) toast.error(state.error)
  }, [state])

  useEffect(() => {
    setName(sacco?.name ?? "")
    setContactEmail(sacco?.contactEmail ?? "")
    setContactPhone(sacco?.contactPhone ?? "")
    setAddress(sacco?.address ?? "")
    setTagline(sacco?.tagline ?? "")
    setColor(sacco?.primaryColor ?? DEFAULT_BRAND_COLOR)
    setLogoUrl(sacco?.logoUrl ?? "")
  }, [sacco])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept:   LOGO_ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize:  LOGO_MAX_SIZE_BYTES,
    onDrop: async (files, rejectedFiles) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        if (rejection.errors.some((e) => e.code === "file-too-large")) {
          toast.error("Image must be less than 2MB")
        } else if (
          rejection.errors.some((e) => e.code === "file-invalid-type")
        ) {
          toast.error("Only JPG, PNG, WEBP, and SVG images are allowed")
        } else {
          toast.error("Invalid file")
        }
        return
      }

      const file = files[0]
      if (!file) return

      // Show local preview immediately
      const preview = URL.createObjectURL(file)
      setLocalPreview(preview)
      setLogoError(false)
      setUploading(true)
      setUploadProgress(0)

      try {
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + PROGRESS_INCREMENT, 90))
        }, PROGRESS_TICK_MS)

        const fd = new FormData()
        fd.append("logo", file)
        const res = await uploadLogoAction({}, fd)

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (res.success && res.url) {
          setLogoUrl(res.url)
          setLocalPreview("")
          URL.revokeObjectURL(preview)
          toast.success("Logo uploaded successfully!")
        } else {
          setLocalPreview("")
          URL.revokeObjectURL(preview)
          toast.error(res.error ?? "Upload failed")
        }
      } catch (error) {
        setLocalPreview("")
        URL.revokeObjectURL(preview)
        toast.error("Upload failed. Please try again.")
      } finally {
        setTimeout(() => {
          setUploading(false)
          setUploadProgress(0)
        }, PROGRESS_CLEAR_DELAY_MS)
      }
    },
  })

  return (
    <div className="max-w-2xl space-y-6">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            SACCO Logo
          </CardTitle>
          <CardDescription>Upload your SACCO logo. Max 2MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-muted bg-muted">
              {(localPreview || (logoUrl && !logoError)) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={localPreview || logoUrl}
                  alt="Logo"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  onError={() => { if (!localPreview) setLogoError(true) }}
                />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {sacco?.name?.slice(0, 1) ?? "S"}
                </span>
              )}
            </div>
            <div
              {...getRootProps()}
              className={`flex-1 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary"}`}
            >
              <input {...getInputProps()} />
              {uploading ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    {uploadProgress}%
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive
                      ? "Drop your logo here"
                      : "Drag & drop or click to upload"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG, WEBP, SVG up to 2MB
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* General Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">SACCO Information</CardTitle>
          <CardDescription>Basic details about your SACCO</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={formAction}
            className="space-y-4"
            key={sacco?.id}
            suppressHydrationWarning
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">SACCO Name *</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kampala Savings SACCO"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="info@yoursacco.ug"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+256 700 000 000"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Physical address"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                name="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Save · Grow · Thrive"
              />
              <p className="text-xs text-muted-foreground">
                This tagline appears on PDF headers and official documents.
              </p>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="primary_color">Brand Color</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-input"
                />
                <Input
                  id="primary_color"
                  name="primary_color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#16a34a"
                  className="flex-1 font-mono"
                />
                <div
                  className="h-10 w-10 shrink-0 rounded-md border border-input"
                  style={{ backgroundColor: color }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This color is used for buttons, badges, and accents throughout
                the app.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED COMPONENTS:
//   GeneralTab({ sacco })
//     – settings tab for SACCO logo, name, contact info, and brand colour
//     – logo upload is immediate (calls uploadLogoAction on drop)
//     – general info form submits via updateGeneralSettingsAction
//
// KEY CONSTANTS:
//   LOGO_MAX_SIZE_BYTES     = 2 097 152  (2 MB)
//   LOGO_ACCEPTED_TYPES     – jpeg, png, webp, svg
//   DEFAULT_BRAND_COLOR     = "#16a34a"
//   PROGRESS_INCREMENT      = 10  (% per tick)
//   PROGRESS_TICK_MS        = 100
//   PROGRESS_CLEAR_DELAY_MS = 500
//
// RELATED FILES:
//   ../actions.ts  – updateGeneralSettingsAction, uploadLogoAction
