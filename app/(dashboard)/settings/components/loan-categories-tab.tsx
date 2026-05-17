"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { addLoanCategoryAction, deleteLoanCategoryAction } from "../actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Trash2, Banknote } from "lucide-react"
import { formatUGX } from "@/lib/utils/format"

export function LoanCategoriesTab({ categories }: { categories: any[] }) {
  const [state, formAction, isPending] = useActionState(
    addLoanCategoryAction,
    {}
  )

  useEffect(() => {
    if (state.success) toast.success("Loan category added!")
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Add Loan Category
          </CardTitle>
          <CardDescription>
            Define different loan products with their limits and interest rates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category Name *</Label>
                <Input name="name" placeholder="e.g. Business Loan" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input name="description" placeholder="Brief description" />
              </div>
              <div className="space-y-1.5">
                <Label>Min Amount (UGX)</Label>
                <Input name="min_amount" type="number" placeholder="e.g. 100000" />
              </div>
              <div className="space-y-1.5">
                <Label>Max Amount (UGX) *</Label>
                <Input name="max_amount" type="number" placeholder="e.g. 5000000" />
              </div>
              <div className="space-y-1.5">
                <Label>Interest Rate (%)</Label>
                <Input name="interest_rate" type="number" step="0.1" placeholder="e.g. 10" />
              </div>
              <div className="space-y-1.5">
                <Label>Max Duration (Months)</Label>
                <Input name="max_duration_months" type="number" placeholder="e.g. 12" />
              </div>
              <div className="space-y-1.5">
                <Label>Requires Guarantor</Label>
                <Select name="requires_guarantor" defaultValue="false">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger >
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
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
          <CardTitle className="text-base">Loan Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Banknote className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No loan categories yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Guarantor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{formatUGX(cat.minAmount ?? 0)}</TableCell>
                    <TableCell>{formatUGX(cat.maxAmount)}</TableCell>
                    <TableCell className="text-green-600 font-semibold">{cat.interestRate}%</TableCell>
                    <TableCell>{cat.maxDurationMonths}mo</TableCell>
                    <TableCell>
                      <Badge variant={cat.requiresGuarantor ? "default" : "outline"}>
                        {cat.requiresGuarantor ? "Required" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={async () => {
                          const res = await deleteLoanCategoryAction(cat.id)
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