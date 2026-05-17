"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import { addSavingsCategoryAction, deleteSavingsCategoryAction } from "../actions"
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
import { Loader2, Plus, Trash2, PiggyBank } from "lucide-react"

export function SavingsCategoriesTab({ categories }: { categories: any[] }) {
  const [state, formAction, isPending] = useActionState(
    addSavingsCategoryAction,
    {}
  )

  useEffect(() => {
    if (state.success) toast.success("Savings category added!")
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Add Savings Category
          </CardTitle>
          <CardDescription>
            Create savings products like regular, fixed deposit, or special accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category Name *</Label>
                <Input name="name" placeholder="e.g. Fixed Deposit" />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input name="description" placeholder="Brief description" />
              </div>
              <div className="space-y-1.5">
                <Label>Interest Rate (%)</Label>
                <Input name="interest_rate" type="number" step="0.1" placeholder="e.g. 5" />
              </div>
              <div className="space-y-1.5">
                <Label>Fixed Account</Label>
                <Select name="is_fixed" defaultValue="false">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Regular</SelectItem>
                    <SelectItem value="true">Fixed</SelectItem>
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
          <CardTitle className="text-base">Savings Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <PiggyBank className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No savings categories yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground">{cat.description ?? "—"}</TableCell>
                    <TableCell className="text-green-600 font-semibold">{cat.interestRate}%</TableCell>
                    <TableCell>
                      <Badge variant={cat.isFixed ? "default" : "outline"}>
                        {cat.isFixed ? "Fixed" : "Regular"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cat.isActive ? "default" : "secondary"}>
                        {cat.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={async () => {
                          const res = await deleteSavingsCategoryAction(cat.id)
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