"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { GeneralTab } from "./general-tab"
import { PaymentsTab } from "./payments-tab"
import { TestPaymentsTab } from "./test-payments-tab"
import { BranchesTab } from "./branches-tab"
import { SecurityTab } from "./security-tab"
import { Building2, CreditCard, Shield, GitBranch } from "lucide-react"
import type { Branch } from "@/db/queries/branches"
import { cn } from "@/lib/utils"

const WIZARD_STEPS = [
  { id: "security", label: "Set Password",  icon: Shield,    color: "text-slate-500" },
  { id: "general",  label: "SACCO Profile", icon: Building2, color: "text-blue-500" },
] as const

interface SettingsClientProps {
  sacco: any
  branches: Branch[]
  staff: { id: string; fullName: string; role: string }[]
  isFirstLogin?: boolean
}

const tabs = [
  { id: "general",       label: "General",       icon: Building2, color: "text-blue-500" },
  { id: "payments",      label: "Payments & SMS", icon: CreditCard, color: "text-orange-500" },
  { id: "test-payments", label: "Test Payments",  icon: CreditCard, color: "text-sky-500" },
  { id: "branches",      label: "Branches",       icon: GitBranch,  color: "text-teal-500" },
  { id: "security",      label: "Security",       icon: Shield,     color: "text-slate-500" },
]

export function SettingsClient({
  sacco,
  branches,
  staff,
  isFirstLogin = false,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [wizardStep, setWizardStep] = useState(0)
  const [wizardDone, setWizardDone] = useState(false)

  useEffect(() => {
    if (!isFirstLogin) {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      if (tab && tabs.some((t) => t.id === tab)) setActiveTab(tab)
    }
  }, [isFirstLogin])

  // ── First-login wizard ──────────────────────────────────────────────────
  if (isFirstLogin && !wizardDone) {
    const totalSteps = WIZARD_STEPS.length
    const currentStep = WIZARD_STEPS[wizardStep]
    const isLast = wizardStep === totalSteps - 1

    function advance() {
      if (isLast) {
        setWizardDone(true)
        window.location.href = "/dashboard"
      } else {
        setWizardStep((s) => s + 1)
      }
    }

    return (
      <div className="space-y-8">
        {/* Wizard header */}
        <div className="mx-auto w-full max-w-lg text-center">
          <h1 className="text-2xl font-bold tracking-tight">Welcome — let's set up your SACCO</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete these steps to get started. You can always update settings later.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mx-auto w-full max-w-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Step {wizardStep + 1} of {totalSteps}</span>
            <span>{currentStep.label}</span>
          </div>
          <div className="flex gap-1">
            {WIZARD_STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors duration-300",
                  i <= wizardStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <div className="flex gap-6 pt-1">
            {WIZARD_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.id} className="flex items-center gap-1.5 text-xs">
                  <Icon className={cn("h-3.5 w-3.5", i <= wizardStep ? step.color : "text-muted-foreground")} />
                  <span className={cn(i <= wizardStep ? "text-foreground font-medium" : "text-muted-foreground")}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="mx-auto w-full max-w-lg">
          {currentStep.id === "security" && (
            <SecurityTab onComplete={() => setWizardStep(1)} />
          )}
          {currentStep.id === "general" && <GeneralTab sacco={sacco} />}
        </div>

        {/* Navigation — hidden on security step (handled by its own submit) */}
        {currentStep.id !== "security" && (
          <div className="mx-auto w-full max-w-lg flex items-center justify-between border-t pt-4">
            <button
              type="button"
              onClick={() => setWizardStep((s) => s - 1)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <div className="flex gap-3">
              {!isLast && currentStep.id !== "general" && (
                <button
                  type="button"
                  onClick={advance}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={advance}
                className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {isLast ? "Go to Dashboard →" : "Next →"}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
  // ── End first-login wizard ──────────────────────────────────────────────

  return (
    <div className="space-y-0">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your SACCO configuration and preferences
        </p>
      </div>

      {/* Horizontal scrollable tab bar */}
      <div className="border-b">
        <nav className="-mb-px flex gap-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const badgeCount = tab.id === "branches" ? branches?.length || 0 : 0

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
                {badgeCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {badgeCount}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className={cn("pt-6", activeTab !== "branches" && "max-w-3xl mx-auto")}>
        {activeTab === "general"       && <GeneralTab sacco={sacco} />}
        {activeTab === "payments"      && <PaymentsTab sacco={sacco} />}
        {activeTab === "test-payments" && <TestPaymentsTab />}
        {activeTab === "branches"      && <BranchesTab branches={branches} staff={staff} />}
        {activeTab === "security"      && <SecurityTab />}
      </div>
    </div>
  )
}
