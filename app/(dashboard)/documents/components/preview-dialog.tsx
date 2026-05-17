"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, FileText, User, Calendar } from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { typeLabels, typeColors } from "./documents-client"
import { type Document } from "./documents-table"

interface PreviewDialogProps {
  doc: Document
  open: boolean
  onClose: () => void
}

export function PreviewDialog({ doc, open, onClose }: PreviewDialogProps) {
  const isPdf = doc.fileName?.toLowerCase().endsWith(".pdf")
  const isImage = /\.(jpg|jpeg|png|webp)$/i.test(doc.fileName ?? "")

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-base">{doc.fileName}</DialogTitle>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[doc.type] ?? ""}`}
                >
                  {typeLabels[doc.type] ?? doc.type}
                </span>
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {doc.memberName} · {doc.memberCode}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(doc.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(doc.blobUrl, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </Button>
              <Button
                size="sm"
                onClick={() => window.open(doc.blobUrl, "_blank")}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Area */}
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border bg-muted/20">
          {isImage && (
            <img
              src={doc.blobUrl}
              alt={doc.fileName}
              className="h-auto max-h-[65vh] w-full object-contain"
            />
          )}
          {isPdf && (
            <iframe
              src={`${doc.blobUrl}#toolbar=1`}
              className="h-[65vh] w-full"
              title={doc.fileName}
            />
          )}
          {!isImage && !isPdf && (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileText className="h-16 w-16 opacity-30" />
              <p className="text-sm">
                Preview not available for this file type
              </p>
              <Button onClick={() => window.open(doc.blobUrl, "_blank")}>
                <Download className="mr-2 h-4 w-4" />
                Download to View
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
