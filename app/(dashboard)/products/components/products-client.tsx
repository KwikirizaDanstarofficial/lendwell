"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { InterestRatesTab } from "../../settings/components/interest-rates-tab"
import { LoanCategoriesTab } from "../../settings/components/loan-categories-tab"
import { SavingsCategoriesTab } from "../../settings/components/savings-categories-tab"
import { FineCategoriesTab } from "../../settings/components/fine-categories-tab"
import { Percent, Banknote, PiggyBank, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductsClientProps {
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

export function ProductsClient({
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
