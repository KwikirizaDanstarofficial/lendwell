// db/queries/interest-rates.ts
import { supabaseAdmin } from "@/lib/supabase/server"

export interface InterestRateData {
  id?: string
  saccoId: string
  minAmount: number
  maxAmount: number
  rate: string
  rateType: "daily" | "monthly" | "annual"
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateInterestRateInput {
  minAmount: number
  maxAmount: number
  rate: number
  rateType: "daily" | "monthly" | "annual"
  isActive?: boolean
}

export interface UpdateInterestRateInput {
  minAmount?: number
  maxAmount?: number
  rate?: number
  rateType?: "daily" | "monthly" | "annual"
  isActive?: boolean
}

/**
 * Get all active interest rates for the current SACCO
 */
export async function getActiveInterestRates(saccoId: string) {
  try {

    const { data, error } = await supabaseAdmin
      .from('interest_rates')
      .select('*')
      .eq('sacco_id', saccoId)
      .eq('is_active', true)
      .order('min_amount', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch active interest rates: ${error.message}`)
    }

    return data.map(rate => ({
      id: rate.id,
      saccoId: rate.sacco_id,
      minAmount: rate.min_amount,
      maxAmount: rate.max_amount,
      rate: rate.rate,
      rateType: rate.rate_type,
      isActive: rate.is_active ?? true,
      createdAt: new Date(rate.created_at),
      updatedAt: new Date(rate.updated_at),
    }))
  } catch (error) {
    console.error("Error fetching active interest rates:", error)
    throw new Error("Failed to fetch active interest rates")
  }
}

/**
 * Get all interest rates (including inactive) for the current SACCO
 */
export async function getAllInterestRates(saccoId: string) {
  try {

    const { data, error } = await supabaseAdmin
      .from('interest_rates')
      .select('*')
      .eq('sacco_id', saccoId)
      .order('min_amount', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch interest rates: ${error.message}`)
    }

    return data.map(rate => ({
      id: rate.id,
      saccoId: rate.sacco_id,
      minAmount: rate.min_amount,
      maxAmount: rate.max_amount,
      rate: rate.rate,
      rateType: rate.rate_type,
      isActive: rate.is_active,
      createdAt: new Date(rate.created_at),
      updatedAt: new Date(rate.updated_at),
    }))
  } catch (error) {
    console.error("Error fetching all interest rates:", error)
    throw new Error("Failed to fetch interest rates")
  }
}

/**
 * Get interest rate by ID
 */
export async function getInterestRateById(id: string, saccoId: string) {
  try {

    const { data, error } = await supabaseAdmin
      .from('interest_rates')
      .select('*')
      .eq('id', id)
      .eq('sacco_id', saccoId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to fetch interest rate: ${error.message}`)
    }

    return {
      id: data.id,
      saccoId: data.sacco_id,
      minAmount: data.min_amount,
      maxAmount: data.max_amount,
      rate: data.rate,
      rateType: data.rate_type,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  } catch (error) {
    console.error("Error fetching interest rate by ID:", error)
    throw new Error("Failed to fetch interest rate")
  }
}

/**
 * Get interest rate for a specific amount
 */
export async function getInterestRateForAmount(
  amount: number,
  saccoId: string
) {
  try {

    const { data: rate, error } = await supabaseAdmin
      .from('interest_rates')
      .select('*')
      .eq('sacco_id', saccoId)
      .eq('is_active', true)
      .lte('min_amount', amount)
      .gte('max_amount', amount)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch interest rate: ${error.message}`)
    }

    if (!rate) return null

    return {
      id: rate.id,
      saccoId: rate.sacco_id,
      minAmount: rate.min_amount,
      maxAmount: rate.max_amount,
      rate: rate.rate,
      rateType: rate.rate_type,
      isActive: rate.is_active,
      createdAt: new Date(rate.created_at),
      updatedAt: new Date(rate.updated_at),
    }
  } catch (error) {
    console.error("Error fetching interest rate for amount:", error)
    throw new Error("Failed to fetch interest rate for amount")
  }
}

/**
 * Check if an amount range overlaps with existing rates
 */
export async function checkOverlappingRanges(
  minAmount: number,
  maxAmount: number,
  saccoId: string,
  excludeId?: string
) {
  try {
    let query = supabaseAdmin
      .from('interest_rates')
      .select('id')
      .eq('sacco_id', saccoId)
      .lte('min_amount', maxAmount)
      .gte('max_amount', minAmount)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query.limit(1)

    if (error) {
      // Network error when offline — skip overlap check, server will validate on sync
      if (!(error as any).status) return false
      throw new Error(`Failed to check overlapping ranges: ${error.message}`)
    }

    return data && data.length > 0
  } catch (error: any) {
    // Offline / network unreachable — skip the check, allow the write to queue
    if (!(error as any)?.status) return false
    console.error("Error checking overlapping ranges:", error)
    throw new Error("Failed to check overlapping ranges")
  }
}

/**
 * Add a new interest rate
 */
export async function addInterestRate(
  data: CreateInterestRateInput,
  saccoId: string
) {
  try {
    // Store amounts as raw UGX (no cents conversion — Uganda shillings have no fractional units)
    const minAmountUGX = Math.floor(data.minAmount)
    const maxAmountUGX = Math.floor(data.maxAmount)

    if (minAmountUGX >= maxAmountUGX) {
      throw new Error("Minimum amount must be less than maximum amount")
    }

    if (minAmountUGX < 0 || maxAmountUGX < 0) {
      throw new Error("Amounts cannot be negative")
    }

    // Check for overlapping ranges
    const hasOverlap = await checkOverlappingRanges(
      minAmountUGX,
      maxAmountUGX,
      saccoId
    )
    if (hasOverlap) {
      throw new Error("This amount range overlaps with an existing range")
    }


    const { data: newRate, error } = await supabaseAdmin
      .from('interest_rates')
      .insert({
        sacco_id: saccoId,
        min_amount: minAmountUGX,
        max_amount: maxAmountUGX,
        rate: data.rate.toString(),
        rate_type: data.rateType,
        is_active: data.isActive !== undefined ? data.isActive : true,
      })
      .select()
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to add interest rate: ${error.message}`)
    }

    return {
      id: newRate.id,
      saccoId: newRate.sacco_id,
      minAmount: newRate.min_amount,
      maxAmount: newRate.max_amount,
      rate: newRate.rate,
      rateType: newRate.rate_type,
      isActive: newRate.is_active,
      createdAt: new Date(newRate.created_at),
      updatedAt: new Date(newRate.updated_at),
    }
  } catch (error) {
    console.error("Error adding interest rate:", error)
    throw error
  }
}

/**
 * Update an existing interest rate
 */
export async function updateInterestRate(
  id: string,
  data: UpdateInterestRateInput,
  saccoId: string
) {
  try {
    // Get existing rate
    const existingRate = await getInterestRateById(id, saccoId)
    if (!existingRate) {
      throw new Error("Interest rate not found")
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Store amounts as raw UGX (no cents conversion)
    if (data.minAmount !== undefined) {
      const minAmountUGX = Math.floor(data.minAmount)
      if (minAmountUGX < 0) throw new Error("Minimum amount cannot be negative")
      updateData.min_amount = minAmountUGX
    }

    if (data.maxAmount !== undefined) {
      const maxAmountUGX = Math.floor(data.maxAmount)
      if (maxAmountUGX < 0) throw new Error("Maximum amount cannot be negative")
      updateData.max_amount = maxAmountUGX
    }

    if (data.rate !== undefined) {
      if (data.rate < 0 || data.rate > 100) {
        throw new Error("Interest rate must be between 0 and 100")
      }
      updateData.rate = data.rate.toString()
    }

    if (data.rateType !== undefined) {
      updateData.rate_type = data.rateType
    }

    if (data.isActive !== undefined) {
      updateData.is_active = data.isActive
    }

    // Check for overlapping ranges if amounts changed
    const minAmount = updateData.min_amount ?? existingRate.minAmount
    const maxAmount = updateData.max_amount ?? existingRate.maxAmount

    if (minAmount >= maxAmount) {
      throw new Error("Minimum amount must be less than maximum amount")
    }

    const hasOverlap = await checkOverlappingRanges(
      minAmount,
      maxAmount,
      saccoId,
      id
    )
    if (hasOverlap) {
      throw new Error("This amount range overlaps with an existing range")
    }


    const { data: updatedRate, error } = await supabaseAdmin
      .from('interest_rates')
      .update(updateData)
      .eq('id', id)
      .eq('sacco_id', saccoId)
      .select()
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to update interest rate: ${error.message}`)
    }

    return {
      id: updatedRate.id,
      saccoId: updatedRate.sacco_id,
      minAmount: updatedRate.min_amount,
      maxAmount: updatedRate.max_amount,
      rate: updatedRate.rate,
      rateType: updatedRate.rate_type,
      isActive: updatedRate.is_active,
      createdAt: new Date(updatedRate.created_at),
      updatedAt: new Date(updatedRate.updated_at),
    }
  } catch (error) {
    console.error("Error updating interest rate:", error)
    throw error
  }
}

/**
 * Deactivate an interest rate (soft delete)
 */
export async function deactivateInterestRate(id: string, saccoId: string) {
  try {

    const { data: deactivatedRate, error } = await supabaseAdmin
      .from('interest_rates')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('sacco_id', saccoId)
      .select()
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to deactivate interest rate: ${error.message}`)
    }

    return {
      id: deactivatedRate.id,
      saccoId: deactivatedRate.sacco_id,
      minAmount: deactivatedRate.min_amount,
      maxAmount: deactivatedRate.max_amount,
      rate: deactivatedRate.rate,
      rateType: deactivatedRate.rate_type,
      isActive: deactivatedRate.is_active,
      createdAt: new Date(deactivatedRate.created_at),
      updatedAt: new Date(deactivatedRate.updated_at),
    }
  } catch (error) {
    console.error("Error deactivating interest rate:", error)
    throw new Error("Failed to deactivate interest rate")
  }
}

/**
 * Activate an interest rate
 */
export async function activateInterestRate(id: string, saccoId: string) {
  try {

    const { data: activatedRate, error } = await supabaseAdmin
      .from('interest_rates')
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('sacco_id', saccoId)
      .select()
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to activate interest rate: ${error.message}`)
    }

    return {
      id: activatedRate.id,
      saccoId: activatedRate.sacco_id,
      minAmount: activatedRate.min_amount,
      maxAmount: activatedRate.max_amount,
      rate: activatedRate.rate,
      rateType: activatedRate.rate_type,
      isActive: activatedRate.is_active,
      createdAt: new Date(activatedRate.created_at),
      updatedAt: new Date(activatedRate.updated_at),
    }
  } catch (error) {
    console.error("Error activating interest rate:", error)
    throw new Error("Failed to activate interest rate")
  }
}

/**
 * Delete an interest rate (hard delete - use with caution)
 */
export async function deleteInterestRate(id: string, saccoId: string) {
  try {

    // Check if any loans are using this interest rate
    const { data: loansWithRate, error: loansError } = await supabaseAdmin
      .from('loans')
      .select('id')
      .eq('interest_rate_id', id)
      .limit(1)

    if (loansError) {
      throw new Error(`Failed to check loans: ${loansError.message}`)
    }

    if (loansWithRate && loansWithRate.length > 0) {
      throw new Error(
        "Cannot delete interest rate that is being used by existing loans"
      )
    }

    const { data: deletedRate, error } = await supabaseAdmin
      .from('interest_rates')
      .delete()
      .eq('id', id)
      .eq('sacco_id', saccoId)
      .select()
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to delete interest rate: ${error.message}`)
    }

    return {
      id: deletedRate.id,
      saccoId: deletedRate.sacco_id,
      minAmount: deletedRate.min_amount,
      maxAmount: deletedRate.max_amount,
      rate: deletedRate.rate,
      rateType: deletedRate.rate_type,
      isActive: deletedRate.is_active,
      createdAt: new Date(deletedRate.created_at),
      updatedAt: new Date(deletedRate.updated_at),
    }
  } catch (error) {
    console.error("Error deleting interest rate:", error)
    throw error
  }
}

/**
 * Get interest rate statistics
 */
export async function getInterestRateStats(saccoId: string) {
  try {

    const { data, error } = await supabaseAdmin
      .from('interest_rates')
      .select('*')
      .eq('sacco_id', saccoId)

    if (error) {
      throw new Error(`Failed to fetch interest rates: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return {
        totalRates: 0,
        activeRates: 0,
        minRate: 0,
        maxRate: 0,
        avgRate: 0,
        minAmount: 0,
        maxAmount: 0,
      }
    }

    const totalRates = data.length
    const activeRates = data.filter(rate => rate.is_active).length

    const rates = data.map(rate => Number(rate.rate))
    const amounts = data.map(rate => rate.min_amount)

    const minRate = Math.min(...rates)
    const maxRate = Math.max(...rates)
    const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length
    const minAmount = Math.min(...amounts)
    const maxAmount = Math.max(...amounts)

    return {
      totalRates,
      activeRates,
      minRate,
      maxRate,
      avgRate,
      minAmount,
      maxAmount,
    }
  } catch (error) {
    console.error("Error fetching interest rate stats:", error)
    throw new Error("Failed to fetch interest rate statistics")
  }
}

/**
 * Bulk add multiple interest rates
 */
export async function bulkAddInterestRates(
  rates: CreateInterestRateInput[],
  saccoId: string
) {
  try {

    // Fetch all existing rates once for client-side overlap validation
    const { data: existingRates } = await supabaseAdmin
      .from('interest_rates')
      .select('min_amount, max_amount')
      .eq('sacco_id', saccoId)

    const toInsert: Record<string, unknown>[] = []
    const results: { success: boolean; data?: unknown; error?: string }[] = []

    for (const rate of rates) {
      const minAmount = Math.floor(rate.minAmount * 100)
      const maxAmount = Math.floor(rate.maxAmount * 100)

      if (minAmount >= maxAmount) {
        results.push({ success: false, error: "Minimum amount must be less than maximum amount", data: rate })
        continue
      }

      const hasOverlap = (existingRates ?? []).some(
        (r) => r.min_amount <= maxAmount && r.max_amount >= minAmount
      )
      if (hasOverlap) {
        results.push({ success: false, error: "This amount range overlaps with an existing range", data: rate })
        continue
      }

      toInsert.push({
        sacco_id: saccoId,
        min_amount: minAmount,
        max_amount: maxAmount,
        rate: rate.rate.toString(),
        rate_type: rate.rateType,
        is_active: rate.isActive !== undefined ? rate.isActive : true,
      })
    }

    if (toInsert.length > 0) {
      const { data: inserted, error } = await supabaseAdmin
        .from('interest_rates')
        .insert(toInsert)
        .select()

      if (error) {
        for (const rate of rates) {
          results.push({ success: false, error: error.message, data: rate })
        }
      } else {
        for (const rate of inserted ?? []) {
          results.push({
            success: true,
            data: {
              id: rate.id,
              saccoId: rate.sacco_id,
              minAmount: rate.min_amount,
              maxAmount: rate.max_amount,
              rate: rate.rate,
              rateType: rate.rate_type,
              isActive: rate.is_active,
              createdAt: new Date(rate.created_at),
              updatedAt: new Date(rate.updated_at),
            },
          })
        }
      }
    }

    return results
  } catch (error) {
    console.error("Error bulk adding interest rates:", error)
    throw new Error("Failed to bulk add interest rates")
  }
}

/**
 * Validate interest rate range
 */
export function validateInterestRateRange(
  minAmount: number,
  maxAmount: number,
  rate: number
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (minAmount <= 0) {
    errors.push("Minimum amount must be greater than 0")
  }

  if (maxAmount <= 0) {
    errors.push("Maximum amount must be greater than 0")
  }

  if (minAmount >= maxAmount) {
    errors.push("Minimum amount must be less than maximum amount")
  }

  if (rate <= 0) {
    errors.push("Interest rate must be greater than 0")
  }

  if (rate > 100) {
    errors.push("Interest rate cannot exceed 100%")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Get recommended interest rate based on risk profile
 */
export async function getRecommendedRate(
  amount: number,
  durationMonths: number,
  saccoId: string,
  memberRiskScore?: number
) {
  try {
    const baseRate = await getInterestRateForAmount(amount, saccoId)
    if (!baseRate) {
      throw new Error("No interest rate found for this amount")
    }

    let recommendedRate = Number(baseRate.rate)

    // Adjust based on duration
    if (durationMonths > 24) {
      recommendedRate += 1 // Longer loans have higher risk
    } else if (durationMonths < 6) {
      recommendedRate -= 0.5 // Shorter loans have lower risk
    }

    // Adjust based on member risk score if provided (1-10, lower is better)
    if (memberRiskScore !== undefined) {
      if (memberRiskScore > 7) {
        recommendedRate += 2 // High risk members pay more
      } else if (memberRiskScore < 3) {
        recommendedRate -= 1 // Low risk members get better rates
      }
    }

    // Ensure rate stays within reasonable bounds
    recommendedRate = Math.max(0, Math.min(100, recommendedRate))

    return {
      recommendedRate,
      baseRate: Number(baseRate.rate),
      adjustments: {
        duration: durationMonths > 24 ? 1 : durationMonths < 6 ? -0.5 : 0,
        risk: memberRiskScore
          ? memberRiskScore > 7
            ? 2
            : memberRiskScore < 3
              ? -1
              : 0
          : 0,
      },
    }
  } catch (error) {
    console.error("Error getting recommended rate:", error)
    throw new Error("Failed to get recommended interest rate")
  }
}
