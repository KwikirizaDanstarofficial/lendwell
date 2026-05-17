"use client"

import { useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
  ExternalLink,
  FileText,
} from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { Badge } from "@/components/ui/badge"
import { deleteDocumentAction } from "../actions"
import { toast } from "sonner"
import { PreviewDialog } from "./preview-dialog"
import { typeLabels, typeColors } from "./documents-client"

export interface Document {
  id: string
  saccoId: string
  createdAt: string | null
  memberId: string
  loanId: string | null
  type: string
  fileName: string
  blobUrl: string
  memberName: string | null
  memberCode: string | null
}

export function DocumentsTable({ documents }: { documents: Document[] }) {
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null)
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const handleDelete = async () => {
    if (!deleteDoc) return
    setDeleting(true)
    const res = await deleteDocumentAction(deleteDoc.id, deleteDoc.blobUrl)
    setDeleting(false)
    if (res.success) {
      toast.success("Document deleted")
      setDeleteDoc(null)
    } else {
      toast.error(res.error)
    }
  }

  const table = useReactTable({
    data: documents,
    columns: [],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
  })

  return (
    <>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>File</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const doc = row.original
              const isImage = /\.(jpg|jpeg|png|webp)$/i.test(doc.fileName ?? "")
              return (
                <TableRow
                  key={doc.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => setPreviewDoc(doc)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                        {isImage ? (
                          <img
                            src={doc.blobUrl}
                            alt={doc.fileName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileText className="h-5 w-5 text-muted-foreground opacity-60" />
                        )}
                      </div>
                      <div>
                        <p className="max-w-[200px] truncate text-sm font-medium">
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground uppercase">
                          {doc.fileName?.split(".").pop()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        doc.type === "loan_agreement"
                          ? "default"
                          : doc.type === "member_document"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {typeLabels[doc.type] ?? doc.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{doc.memberName}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {doc.memberCode}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(doc.createdAt)}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => setPreviewDoc(doc)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(doc.blobUrl, "_blank")}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(doc.blobUrl, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in New Tab
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteDoc(doc)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      {previewDoc && (
        <PreviewDialog
          doc={previewDoc}
          open={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteDoc?.fileName}</strong> from storage. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
