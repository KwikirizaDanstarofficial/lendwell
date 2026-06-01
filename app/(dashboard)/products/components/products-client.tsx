"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@powersync/react"
import { Badge } from "@/components/ui/badge"
import { InterestRatesTab } from "../../settings/components/interest-rates-tab"
import { LoanCategoriesTab } from "../../settings/components/loan-categories-tab"
import { SavingsCategoriesTab } from "../../settings/components/savings-categories-tab"
import { FineCategoriesTab } from "../../settings/components/fine-categories-tab"
import { Percent, Banknote, PiggyBank, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductsClientProps {
  saccoId: string
  interestRates: any[]
  loanCategories: any[]
  savingsCategories: any[]
  fineCategories: any[]
}

const tabs = [
  { id: "loans",    label: "Loan Categories",    icon: Banknote,     color: "text-purple-500" },
  { id: "savings",  label: "Savings Categories", icon: PiggyBank,    color: "text-emerald-500" },
  { id: "fines",    label: "Fine Categories",    icon: AlertCircle,  color: "text-red-500" },
  { id: "interest", label: "Interest Rates",     icon: Percent,      color: "text-green-500" },
]

export function ProductsClient({ saccoId }: { saccoId: string }) {
  const { data: rateRows = [] } = useQuery("SELECT id, sacco_id, min_amount, max_amount, rate, rate_type, is_active, created_at, updated_at FROM interest_rates WHERE sacco_id = ?", [saccoId])
  const { data: loanCatRows = [] } = useQuery("SELECT id, sacco_id, name, description, min_amount, max_amount, interest_rate, max_duration_months, requires_guarantor, is_active, created_at FROM loan_categories WHERE sacco_id = ?", [saccoId])
  const { data: savCatRows = [] } = useQuery("SELECT id, sacco_id, name, description, interest_rate, is_fixed, is_active, created_at FROM savings_categories WHERE sacco_id = ?", [saccoId])
  const { data: fineCatRows = [] } = useQuery("SELECT id, sacco_id, name, default_amount, created_at FROM fine_categories WHERE sacco_id = ?", [saccoId])
  const interestRates = useMemo(() => (rateRows as any[]).map((r) => ({ id: r.id, saccoId: r.sacco_id, minAmount: Number(r.min_amount), maxAmount: Number(r.max_amount), rate: r.rate, rateType: r.rate_type, isActive: Boolean(r.is_active), createdAt: new Date(r.created_at), updatedAt: new Date(r.updated_at) })), [rateRows])
  const loanCategories = useMemo(() => (loanCatRows as any[]).map((r) => ({ id: r.id, saccoId: r.sacco_id, name: r.name, description: r.description, minAmount: Number(r.min_amount), maxAmount: Number(r.max_amount), interestRate: r.interest_rate, maxDurationMonths: r.max_duration_months, requiresGuarantor: Boolean(r.requires_guarantor), isActive: Boolean(r.is_active), createdAt: new Date(r.created_at) })), [loanCatRows])
  const savingsCategories = useMemo(() => (savCatRows as any[]).map((r) => ({ id: r.id, saccoId: r.sacco_id, name: r.name, description: r.description, interestRate: r.interest_rate, isFixed: Boolean(r.is_fixed), isActive: Boolean(r.is_active), createdAt: new Date(r.created_at) })), [savCatRows])
  const fineCategories = useMemo(() => (fineCatRows as any[]).map((r) => ({ id: r.id, saccoId: r.sacco_id, name: r.name, defaultAmount: Number(r.default_amount ?? 0), createdAt: new Date(r.created_at) })), [fineCatRows])
  return <ProductsClientInner saccoId={saccoId} interestRates={interestRates} loanCategories={loanCategories} savingsCategories={savingsCategories} fineCategories={fineCategories} />
}

export function ProductsClientInner({
  interestRates,
  loanCategories,
  savingsCategories,
  fineCategories,
}: ProductsClientProps) {
  const [activeTab, setActiveTab] = useState("loans")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tab = params.get("tab")
    if (tab && tabs.some((t) => t.id === tab)) setActiveTab(tab)
  }, [])

  const counts: Record<string, number> = {
    loans:    loanCategories?.length    || 0,
    savings:  savingsCategories?.length || 0,
    fines:    fineCategories?.length    || 0,
    interest: interestRates?.length     || 0,
  }

  return (
    <div className="space-y-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage loan categories, savings products, fine types, and interest rate tiers
        </p>
      </div>

      {/* Horizontal tab bar */}
      <div className="border-b">
        <nav className="-mb-px flex gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? tab.color : "")} />
                {tab.label}
                {counts[tab.id] > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {counts[tab.id]}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="pt-6">
        {activeTab === "loans"    && <LoanCategoriesTab    categories={loanCategories} />}
        {activeTab === "savings"  && <SavingsCategoriesTab categories={savingsCategories} />}
        {activeTab === "fines"    && <FineCategoriesTab    categories={fineCategories} />}
        {activeTab === "interest" && <InterestRatesTab     rates={interestRates} />}
      </div>
    </div>
  )
}
