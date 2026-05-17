"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { addFineCategoryAction, deleteFineCategoryAction } from "../actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react"
import { formatUGX } from "@/lib/utils/format"

export function FineCategoriesTab({ categories }: { categories: any[] }) {
  const [state, formAction, isPending] = useActionState(
    addFineCategoryAction,
    {}
  )

  useEffect(() => {
    if (state.success) toast.success("Fine category added!")
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Add Fine Category
          </CardTitle>
          <CardDescription>
            Create fine types with default amounts that auto-fill when issuing fines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category Name *</Label>
                <Input name="name" placeholder="e.g. Late Payment" />
              </div>
              <div className="space-y-1.5">
                <Label>Default Amount (UGX)</Label>
                <Input name="default_amount" type="number" placeholder="e.g. 20000" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Category
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fine Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No fine categories yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Default Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-red-600 font-semibold">
                      {formatUGX(cat.defaultAmount ?? 0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={async () => {
                          const res = await deleteFineCategoryAction(cat.id)
                          if (res.success) toast.success("Category deleted")
                          else toast.error(res.error)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}