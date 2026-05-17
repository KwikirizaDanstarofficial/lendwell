"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import {
  addInterestRateAction,
  deleteInterestRateAction,
  SettingsState,
} from "../actions"
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
import { Loader2, Plus, Trash2, Percent } from "lucide-react"
import { formatUGX } from "@/lib/utils/format"

const initialState: SettingsState = {}

export function InterestRatesTab({ rates }: { rates: any[] }) {
  const [state, formAction, isPending] = useActionState(
    addInterestRateAction,
    initialState
  )

  useEffect(() => {
    if (state.success) toast.success("Interest rate added!")
    if (state.error) toast.error(state.error)
  }, [state])

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Add Rate Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Add Interest Rate Tier
          </CardTitle>
          <CardDescription>
            Define interest rates based on loan amount ranges. The system auto-selects the applicable rate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="min_amount">Min Amount (UGX)</Label>
              <Input id="min_amount" name="min_amount" type="number" placeholder="e.g. 100000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="max_amount">Max Amount (UGX)</Label>
              <Input id="max_amount" name="max_amount" type="number" placeholder="e.g. 500000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rate">Rate (%)</Label>
              <Input id="rate" name="rate" type="number" step="0.1" placeholder="e.g. 10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rate_type">Type</Label>
              <Select name="rate_type" defaultValue="monthly">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-4 flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Rate
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interest Rate Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Percent className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No interest rates defined yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Min Amount</TableHead>
                  <TableHead>Max Amount</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>{formatUGX(rate.minAmount)}</TableCell>
                    <TableCell>{formatUGX(rate.maxAmount)}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {rate.rate}%
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rate.rateType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rate.isActive ? "default" : "secondary"}>
                        {rate.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={async () => {
                          const res = await deleteInterestRateAction(rate.id)
                          if (res.success) toast.success("Rate deleted")
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