// app/(dashboard)/members/components/import-excel.tsx
// Dialog for bulk-importing members from an Excel (.xlsx / .xls) file.
// Parses the file client-side with ExcelJS, validates each row,
// shows a preview with valid/invalid counts, then calls the server action.
"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import ExcelJS from "exceljs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { importMembersAction } from "@/app/(dashboard)/members/actions"

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum acceptable phone number length for validation. */
const MIN_PHONE_LENGTH = 9

/** First data row index (row 1 is the header). */
const FIRST_DATA_ROW = 2

/** Maximum number of per-row error messages shown in the error toast. */
const MAX_VISIBLE_ROW_ERRORS = 5

/** MIME types accepted by the file dropzone. */
const ACCEPTED_FILE_TYPES = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
} as const

/**
 * Recognised column header variants for each required/optional field.
 * Matching is case-insensitive and whitespace-insensitive.
 */
const COLUMN_VARIANTS = {
  fullName:   ["Full Name", "Fullname", "Name", "Member Name"],
  phone:      ["Phone", "Phone Number", "Tel", "Mobile", "Telephone"],
  email:      ["Email", "E-mail", "Email Address"],
  nationalId: ["National ID", "NationalId", "ID Number", "NIN", "National Identification"],
  address:    ["Address", "Physical Address", "Location"],
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImportExcelProps {
  open:    boolean
  onClose: () => void
}

/** One parsed data row from the uploaded spreadsheet. */
interface ParsedRow {
  full_name:   string
  phone:       string
  email:       string
  national_id: string
  address:     string
  /** Whether this row passed all validation checks. */
  valid:  boolean
  /** Human-readable validation error messages for invalid rows. */
  errors: string[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportExcel({ open, onClose }: ImportExcelProps) {
  const [rows,      setRows]      = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)

  /**
   * Look up a column index from the header map by trying multiple name variants.
   * Returns the column index as a string, or null if no variant matched.
   */
  const resolveColumnIndex = (
    headerMap: Map<string, number>,
    ...variants: string[]
  ): string | null => {
    for (const variant of variants) {
      const normalised = variant.toLowerCase().replace(/\s+/g, "")
      if (headerMap.has(normalised)) return headerMap.get(normalised)!.toString()
    }
    return null
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const buffer   = event.target?.result as ArrayBuffer
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(buffer)

      const worksheet = workbook.getWorksheet(1)
      if (!worksheet) {
        toast.error("Invalid Excel file: no worksheet found")
        return
      }

      // Build a normalised (lower, no-space) header → column-number map
      const headerMap = new Map<string, number>()
      const headerRow = worksheet.getRow(1)
      headerRow.eachCell((cell, colNumber) => {
        const rawHeader  = String(cell.value ?? "").trim()
        const normHeader = rawHeader.toLowerCase().replace(/\s+/g, "")
        if (normHeader) headerMap.set(normHeader, colNumber)
      })

      // Helper to read a cell value by column index (null-safe)
      const getCellValue = (rowNumber: number, colIndex: number | null): string => {
        if (colIndex === null) return ""
        return String(worksheet.getCell(rowNumber, colIndex).value ?? "").trim()
      }

      // Read all data rows until an empty first cell is found
      let rowNumber = FIRST_DATA_ROW
      const rawRows: Record<string, string>[] = []
      while (true) {
        const firstCellValue = worksheet.getCell(rowNumber, 1).value
        if (!firstCellValue || String(firstCellValue).trim() === "") break

        const rowData: Record<string, string> = {}
        headerMap.forEach((colIdx, key) => {
          rowData[key] = String(worksheet.getCell(rowNumber, colIdx).value ?? "").trim()
        })
        rawRows.push(rowData)
        rowNumber++
      }

      // Resolve column indices using the flexible variant lists
      const fullNameColIdx   = resolveColumnIndex(headerMap, ...COLUMN_VARIANTS.fullName)
      const phoneColIdx      = resolveColumnIndex(headerMap, ...COLUMN_VARIANTS.phone)
      const emailColIdx      = resolveColumnIndex(headerMap, ...COLUMN_VARIANTS.email)
      const nationalIdColIdx = resolveColumnIndex(headerMap, ...COLUMN_VARIANTS.nationalId)
      const addressColIdx    = resolveColumnIndex(headerMap, ...COLUMN_VARIANTS.address)

      // Abort early if any required column is missing
      if (!fullNameColIdx || !phoneColIdx || !nationalIdColIdx) {
        const missingCols = [
          !fullNameColIdx   && "'Full Name'",
          !phoneColIdx      && "'Phone'",
          !nationalIdColIdx && "'National ID'",
        ].filter(Boolean)
        toast.error(
          `Missing required columns: ${missingCols.join(", ")}. ` +
          `Found: ${[...headerMap.keys()].join(", ")}`
        )
        return
      }

      // Parse and validate each row
      const parsedRows: ParsedRow[] = rawRows.map((row) => {
        const rowErrors: string[] = []

        const full_name   = row[fullNameColIdx] ?? ""
        const phone       = row[phoneColIdx]    ?? ""
        const email       = emailColIdx      ? (row[emailColIdx]      ?? "") : ""
        const national_id = row[nationalIdColIdx] ?? ""
        const address     = addressColIdx    ? (row[addressColIdx]    ?? "") : ""

        if (!full_name)                   rowErrors.push("Full Name required")
        if (!phone || phone.length < MIN_PHONE_LENGTH) rowErrors.push("Valid phone required")
        if (!national_id)                 rowErrors.push("National ID required")

        return {
          full_name, phone, email, national_id, address,
          valid:  rowErrors.length === 0,
          errors: rowErrors,
        }
      })

      setRows(parsedRows)
    }

    reader.readAsArrayBuffer(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept:   ACCEPTED_FILE_TYPES,
    maxFiles: 1,
  })

  const validRows   = rows.filter((r) => r.valid)
  const invalidRows = rows.filter((r) => !r.valid)

  const handleImport = async () => {
    setImporting(true)
    try {
      const result = await importMembersAction(
        validRows.map(({ full_name, phone, email, national_id, address }) => ({
          full_name, phone, email, national_id, address,
        }))
      )

      if (result.success) {
        const countLabel = `${result.imported} member${result.imported !== 1 ? "s" : ""}`
        toast.success(`${countLabel} imported successfully`)

        if (result.errors && result.errors.length > 0) {
          const visibleErrors = result.errors.slice(0, MAX_VISIBLE_ROW_ERRORS)
          const remaining     = result.errors.length - visibleErrors.length
          toast.error(
            `${result.errors.length} row${result.errors.length !== 1 ? "s" : ""} skipped:\n` +
            visibleErrors.join("\n") +
            (remaining > 0 ? `\n...and ${remaining} more` : ""),
            { duration: 8000 }
          )
        }

        setRows([])
        onClose()
      } else {
        toast.error(result.error ?? "Import failed")
      }
    } catch {
      toast.error("Import failed. Please try again.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Members from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file with columns: Full Name, Phone, Email,
            National ID, Address
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          /* ── Dropzone ── */
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary hover:bg-muted/30"}`}
          >
            <input {...getInputProps()} />
            <FileSpreadsheet className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-base font-medium">
              {isDragActive ? "Drop your file here" : "Drag & drop or click to upload"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Supports .xlsx and .xls files
            </p>
            <Button variant="outline" className="mt-4">
              <Upload className="mr-2 h-4 w-4" />
              Browse File
            </Button>
          </div>
        ) : (
          /* ── Preview table ── */
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                {validRows.length} valid
              </Badge>
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3.5 w-3.5" />
                {invalidRows.length} invalid
              </Badge>
            </div>

            <div className="max-h-64 divide-y overflow-y-auto rounded-lg border">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className={`flex items-start justify-between p-3 text-sm ${
                    !row.valid ? "bg-destructive/5" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium">{row.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.phone} · {row.national_id}
                    </p>
                  </div>
                  {row.valid ? (
                    <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <div className="text-right">
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                      <p className="mt-0.5 text-xs text-destructive">
                        {row.errors.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRows([])}>
                Reset
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
              >
                {importing
                  ? "Importing..."
                  : `Import ${validRows.length} Members`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Appendix ─────────────────────────────────────────────────────────────────
//
// EXPORTED COMPONENTS:
//   ImportExcel({ open, onClose })
//     – drag-and-drop Excel import dialog
//     – parses client-side, previews rows, then calls importMembersAction
//
// KEY CONSTANTS:
//   MIN_PHONE_LENGTH       = 9
//   FIRST_DATA_ROW         = 2   (row 1 = header)
//   MAX_VISIBLE_ROW_ERRORS = 5   (truncated in error toast)
//   ACCEPTED_FILE_TYPES    – .xlsx and .xls only
//   COLUMN_VARIANTS        – flexible header name mappings per field
//
// REQUIRED EXCEL COLUMNS:
//   Full Name, Phone, National ID
//
// OPTIONAL EXCEL COLUMNS:
//   Email, Address
//
// RELATED FILES:
//   app/(dashboard)/members/actions.ts  – importMembersAction server action
//   components/ui/dialog.tsx            – Dialog, DialogContent, etc.
