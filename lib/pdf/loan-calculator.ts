// lib/loan-calculator.ts

export interface LoanCalculation {
  principal: number
  interestRate: number
  interestType: "daily" | "monthly" | "annual"
  durationMonths: number
  totalInterest: number
  totalExpectedReceived: number
  dailyPayment: number
  monthlyPayment: number
  latePenaltyFee: number
}

export interface LoanScheduleItem {
  installment: number
  date: string
  amount: number
  balance: number
  principalPaid: number
  interestPaid: number
}

export interface AmortizationItem {
  month: number
  payment: number
  principalPaid: number
  interestPaid: number
  remainingBalance: number
}

/**
 * Calculate loan details including interest, payments, and penalties
 */
export function calculateLoan({
  principal,
  interestRate,
  interestType,
  durationMonths,
  latePenaltyPercent = 5,
}: {
  principal: number
  interestRate: number
  interestType: "daily" | "monthly" | "annual"
  durationMonths: number
  latePenaltyPercent?: number
}): LoanCalculation {
  let totalInterest = 0

  // Calculate total interest based on interest type
  if (interestType === "daily") {
    const days = durationMonths * 30
    totalInterest = (principal * interestRate * days) / 100
  } else if (interestType === "monthly") {
    totalInterest = (principal * interestRate * durationMonths) / 100
  } else {
    const years = durationMonths / 12
    totalInterest = (principal * interestRate * years) / 100
  }

  const totalExpectedReceived = principal + totalInterest
  const latePenaltyFee = Math.floor((totalExpectedReceived * latePenaltyPercent) / 100)

  // Calculate payment schedules
  const days = durationMonths * 30
  const dailyPayment = Math.ceil(totalExpectedReceived / days)
  const monthlyPayment = Math.ceil(totalExpectedReceived / durationMonths)

  return {
    principal,
    interestRate,
    interestType,
    durationMonths,
    totalInterest,
    totalExpectedReceived,
    dailyPayment,
    monthlyPayment,
    latePenaltyFee,
  }
}

/**
 * Get applicable interest rate based on loan amount
 */
export function getInterestRateForAmount(
  amount: number,
  interestRates: Array<{
    min_amount: number
    max_amount: number
    rate: string
    rate_type: string | null
  }>
): { rate: number; rateType: "daily" | "monthly" | "annual" } {
  // Sort rates by min_amount to ensure proper order
  const sortedRates = [...interestRates].sort((a, b) => a.min_amount - b.min_amount)
  
  const applicable = sortedRates.find(
    rate => amount >= rate.min_amount && amount <= rate.max_amount
  )
  
  if (!applicable) {
    throw new Error(`No interest rate defined for amount ${amount}`)
  }
  
  return {
    rate: Number(applicable.rate),
    rateType: applicable.rate_type as "daily" | "monthly" | "annual",
  }
}

/**
 * Generate loan repayment schedule
 */
export function formatLoanSchedule(
  totalExpectedReceived: number,
  durationMonths: number,
  startDate: Date
): LoanScheduleItem[] {
  const schedule: LoanScheduleItem[] = []
  const monthlyPayment = Math.ceil(totalExpectedReceived / durationMonths)
  let remainingBalance = totalExpectedReceived

  for (let i = 1; i <= durationMonths; i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    
    const payment = monthlyPayment
    const interestPaid = 0 // Simplified - would need actual interest calculation for detailed amortization
    const principalPaid = payment - interestPaid
    remainingBalance = Math.max(0, remainingBalance - payment)
    
    schedule.push({
      installment: i,
      date: date.toLocaleDateString(),
      amount: payment,
      balance: remainingBalance,
      principalPaid,
      interestPaid,
    })
  }

  return schedule
}

/**
 * Generate detailed amortization schedule
 */
export function generateAmortizationSchedule({
  principal,
  interestRate,
  interestType,
  durationMonths,
}: {
  principal: number
  interestRate: number
  interestType: "daily" | "monthly" | "annual"
  durationMonths: number
}): AmortizationItem[] {
  const schedule: AmortizationItem[] = []
  
  // Calculate monthly interest rate
  let monthlyRate = 0
  if (interestType === "daily") {
    monthlyRate = (interestRate / 100) * 30
  } else if (interestType === "monthly") {
    monthlyRate = interestRate / 100
  } else {
    monthlyRate = (interestRate / 100) / 12
  }
  
  // Calculate monthly payment using amortization formula
  const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, durationMonths) / 
    (Math.pow(1 + monthlyRate, durationMonths) - 1)
  
  let remainingBalance = principal
  
  for (let month = 1; month <= durationMonths; month++) {
    const interestPaid = remainingBalance * monthlyRate
    const principalPaid = monthlyPayment - interestPaid
    remainingBalance -= principalPaid
    
    schedule.push({
      month,
      payment: Math.ceil(monthlyPayment),
      principalPaid: Math.ceil(principalPaid),
      interestPaid: Math.ceil(interestPaid),
      remainingBalance: Math.max(0, Math.ceil(remainingBalance)),
    })
  }
  
  return schedule
}

/**
 * Calculate early repayment savings
 */
export function calculateEarlyRepayment(
  currentBalance: number,
  remainingMonths: number,
  interestRate: number,
  interestType: "daily" | "monthly" | "annual"
): {
  remainingInterest: number
  earlyRepaymentSavings: number
  totalToPay: number
} {
  let monthlyRate = 0
  if (interestType === "daily") {
    monthlyRate = (interestRate / 100) * 30
  } else if (interestType === "monthly") {
    monthlyRate = interestRate / 100
  } else {
    monthlyRate = (interestRate / 100) / 12
  }
  
  // Calculate remaining interest if paid over original term
  let remainingInterest = 0
  let balance = currentBalance
  
  for (let i = 0; i < remainingMonths; i++) {
    const interest = balance * monthlyRate
    remainingInterest += interest
    const principalPaid = (currentBalance / remainingMonths) // Simplified
    balance -= principalPaid
  }
  
  // Early repayment saves all remaining interest
  const earlyRepaymentSavings = remainingInterest
  const totalToPay = currentBalance // No future interest
  
  return {
    remainingInterest: Math.ceil(remainingInterest),
    earlyRepaymentSavings: Math.ceil(earlyRepaymentSavings),
    totalToPay: Math.ceil(totalToPay),
  }
}

/**
 * Calculate late payment penalty
 */
export function calculateLatePenalty(
  overdueAmount: number,
  daysOverdue: number,
  penaltyRate: number = 5 // Default 5%
): number {
  const penaltyPercentage = (penaltyRate / 100)
  const penalty = overdueAmount * penaltyPercentage * (daysOverdue / 30)
  return Math.ceil(penalty)
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `UGX ${(amount / 100).toLocaleString()}`
}

/**
 * Validate loan parameters
 */
export function validateLoanParams(
  principal: number,
  durationMonths: number,
  interestRate: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (principal <= 0) {
    errors.push("Principal amount must be greater than 0")
  }
  
  if (durationMonths < 1) {
    errors.push("Duration must be at least 1 month")
  }
  
  if (durationMonths > 60) {
    errors.push("Duration cannot exceed 60 months")
  }
  
  if (interestRate < 0) {
    errors.push("Interest rate cannot be negative")
  }
  
  if (interestRate > 100) {
    errors.push("Interest rate cannot exceed 100%")
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Calculate maximum loan amount based on member's savings
 */
export function calculateMaxLoanAmount(
  savingsBalance: number,
  multiplier: number = 3 // Typically 3x savings
): number {
  return savingsBalance * multiplier
}

/**
 * Calculate loan affordability
 */
export function calculateAffordability(
  monthlyIncome: number,
  monthlyExpenses: number,
  requestedMonthlyPayment: number,
  maxDebtToIncomeRatio: number = 0.4 // 40% max DTI
): {
  affordable: boolean
  maxAffordablePayment: number
  debtToIncomeRatio: number
} {
  const disposableIncome = monthlyIncome - monthlyExpenses
  const maxAffordablePayment = disposableIncome * maxDebtToIncomeRatio
  const debtToIncomeRatio = requestedMonthlyPayment / monthlyIncome
  
  return {
    affordable: requestedMonthlyPayment <= maxAffordablePayment,
    maxAffordablePayment,
    debtToIncomeRatio,
  }
}

/**
 * Calculate total cost of loan
 */
export function calculateTotalLoanCost(
  principal: number,
  totalInterest: number,
  fees: number = 0,
  penalties: number = 0
): {
  totalCost: number
  costBreakdown: {
    principal: number
    interest: number
    fees: number
    penalties: number
  }
} {
  const totalCost = principal + totalInterest + fees + penalties
  
  return {
    totalCost,
    costBreakdown: {
      principal,
      interest: totalInterest,
      fees,
      penalties,
    },
  }
}

/**
 * Calculate break-even point for early repayment
 */
export function calculateBreakEvenPoint(
  currentBalance: number,
  monthlyPayment: number,
  monthsPaid: number,
  totalMonths: number
): {
  breakEvenMonth: number
  totalPaid: number
  remainingToPay: number
} {
  const totalToPay = currentBalance
  const breakEvenMonth = monthsPaid + Math.ceil(totalToPay / monthlyPayment)
  const totalPaid = monthlyPayment * monthsPaid
  const remainingToPay = totalToPay
  
  return {
    breakEvenMonth,
    totalPaid,
    remainingToPay,
  }
}

/**
 * Generate loan summary text
 */
export function generateLoanSummary(calculation: LoanCalculation): string {
  const summary = `
    Loan Summary:
    • Principal: ${formatCurrency(calculation.principal)}
    • Interest Rate: ${calculation.interestRate}% (${calculation.interestType})
    • Duration: ${calculation.durationMonths} months
    • Total Interest: ${formatCurrency(calculation.totalInterest)}
    • Total to Repay: ${formatCurrency(calculation.totalExpectedReceived)}
    • Monthly Payment: ${formatCurrency(calculation.monthlyPayment)}
    • Daily Payment: ${formatCurrency(calculation.dailyPayment)}
    • Late Penalty (5%): ${formatCurrency(calculation.latePenaltyFee)}
  `
  
  return summary.trim()
}