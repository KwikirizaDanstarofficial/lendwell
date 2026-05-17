import { supabaseAdmin } from "@/lib/supabase/server"

export async function getSaccoSettings(saccoId: string) {
  const { data, error } = await supabaseAdmin
    .from('saccos')
    .select('*')
    .eq('id', saccoId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch sacco settings: ${error.message}`)
  }

  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    code: data.code,
    logoUrl: data.logo_url,
    primaryColor: data.primary_color,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    address: data.address,
    settings: data.settings,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    onboardingCompleted: data.onboarding_completed,
    tagline: data.tagline,
    website: data.website,
    registrationNumber: data.registration_number,
    slug: data.slug,
    country: data.country,
    status: data.status,
    plan: data.plan,
    trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : null,
    subscriptionEndsAt: data.subscription_ends_at ? new Date(data.subscription_ends_at) : null,
    notes: data.notes,
    createdByCms: data.created_by_cms,
  }
}

export async function getInterestRates(saccoId: string) {
  const supabase = supabaseAdmin

  const { data, error } = await supabase
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
}

export async function getLoanCategories(saccoId: string) {
  const supabase = supabaseAdmin

  const { data, error } = await supabase
    .from('loan_categories')
    .select('*')
    .eq('sacco_id', saccoId)

  if (error) {
    throw new Error(`Failed to fetch loan categories: ${error.message}`)
  }

  return data.map(category => ({
    id: category.id,
    saccoId: category.sacco_id,
    name: category.name,
    description: category.description,
    minAmount: category.min_amount,
    maxAmount: category.max_amount,
    interestRate: category.interest_rate,
    maxDurationMonths: category.max_duration_months,
    requiresGuarantor: category.requires_guarantor,
    isActive: category.is_active,
    createdAt: new Date(category.created_at),
  }))
}

export async function getSavingsCategories(saccoId: string) {
  const supabase = supabaseAdmin

  const { data, error } = await supabase
    .from('savings_categories')
    .select('*')
    .eq('sacco_id', saccoId)

  if (error) {
    throw new Error(`Failed to fetch savings categories: ${error.message}`)
  }

  return data.map(category => ({
    id: category.id,
    saccoId: category.sacco_id,
    name: category.name,
    description: category.description,
    interestRate: category.interest_rate,
    isFixed: category.is_fixed,
    isActive: category.is_active,
    createdAt: new Date(category.created_at),
  }))
}

export async function getFineCategories(saccoId: string) {
  const supabase = supabaseAdmin

  const { data, error } = await supabase
    .from('fine_categories')
    .select('*')
    .eq('sacco_id', saccoId)

  if (error) {
    throw new Error(`Failed to fetch fine categories: ${error.message}`)
  }

  return data.map(category => ({
    id: category.id,
    saccoId: category.sacco_id,
    name: category.name,
    defaultAmount: category.default_amount,
    createdAt: new Date(category.created_at),
  }))
}

export async function getPaymentSettings(saccoId: string) {
  const sacco = await getSaccoSettings(saccoId)
  const settings = (() => {
    try {
      return JSON.parse(sacco?.settings ?? "{}")
    } catch {
      return {}
    }
  })()
  const payments = settings?.payments ?? {}

  // Auto-enable Flutterwave if secret key is configured
  if (process.env.FLW_SECRET_KEY && !payments.flutterwave_enabled) {
    payments.flutterwave_enabled = true
  }

  return payments
}
