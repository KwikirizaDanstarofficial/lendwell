export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          sacco_id: string
          action: string
          entity: string
          entity_id: string | null
          diff: string | null
          created_at: string
          actor_id: string | null
          actor_name: string | null
          actor_role: string | null
          ip_address: string | null
        }
        Insert: {
          id?: string
          sacco_id: string
          action: string
          entity: string
          entity_id?: string | null
          diff?: string | null
          created_at?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          ip_address?: string | null
        }
        Update: {
          id?: string
          sacco_id?: string
          action?: string
          entity?: string
          entity_id?: string | null
          diff?: string | null
          created_at?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          ip_address?: string | null
        }
      }
      cms_activity_logs: {
        Row: {
          id: string
          admin_id: string | null
          admin_name: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          entity_name: string | null
          details: any
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          admin_name?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          entity_name?: string | null
          details?: any
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          admin_name?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          entity_name?: string | null
          details?: any
          ip_address?: string | null
          created_at?: string
        }
      }
      complaints: {
        Row: {
          id: string
          sacco_id: string
          member_id: string | null
          subject: string
          body: string
          status: 'open' | 'in_progress' | 'resolved'
          resolved_at: string | null
          created_at: string
          complaint_ref: string | null
          category: string
          priority: string
          assigned_to: string | null
          resolution_notes: string | null
          resolved_by: string | null
          satisfaction_rating: number | null
          feedback: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          member_id?: string | null
          subject: string
          body: string
          status?: 'open' | 'in_progress' | 'resolved'
          resolved_at?: string | null
          created_at?: string
          complaint_ref?: string | null
          category?: string
          priority?: string
          assigned_to?: string | null
          resolution_notes?: string | null
          resolved_by?: string | null
          satisfaction_rating?: number | null
          feedback?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          member_id?: string | null
          subject?: string
          body?: string
          status?: 'open' | 'in_progress' | 'resolved'
          resolved_at?: string | null
          created_at?: string
          complaint_ref?: string | null
          category?: string
          priority?: string
          assigned_to?: string | null
          resolution_notes?: string | null
          resolved_by?: string | null
          satisfaction_rating?: number | null
          feedback?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          sacco_id: string
          member_id: string
          loan_id: string | null
          type: 'national_id' | 'registration_form' | 'loan_contract' | 'membership_certificate' | 'other'
          file_name: string
          blob_url: string
          created_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          member_id: string
          loan_id?: string | null
          type: 'national_id' | 'registration_form' | 'loan_contract' | 'membership_certificate' | 'other'
          file_name: string
          blob_url: string
          created_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          member_id?: string
          loan_id?: string | null
          type?: 'national_id' | 'registration_form' | 'loan_contract' | 'membership_certificate' | 'other'
          file_name?: string
          blob_url?: string
          created_at?: string
        }
      }
      fine_categories: {
        Row: {
          id: string
          sacco_id: string
          name: string
          default_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          name: string
          default_amount?: number
          created_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          name?: string
          default_amount?: number
          created_at?: string
        }
      }
      fines: {
        Row: {
          id: string
          sacco_id: string
          member_id: string
          category_id: string | null
          amount: number
          reason: string | null
          status: 'pending' | 'paid' | 'waived'
          paid_at: string | null
          created_at: string
          fine_ref: string | null
          description: string | null
          priority: string
          due_date: string | null
          payment_method: 'cash' | 'mobile_money' | 'bank' | 'flutterwave' | 'mtn' | 'airtel' | null
          payment_reference: string | null
          waived_by: string | null
          waiver_reason: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          member_id: string
          category_id?: string | null
          amount: number
          reason?: string | null
          status?: 'pending' | 'paid' | 'waived'
          paid_at?: string | null
          created_at?: string
          fine_ref?: string | null
          description?: string | null
          priority?: string
          due_date?: string | null
          payment_method?: 'cash' | 'mobile_money' | 'bank' | 'flutterwave' | 'mtn' | 'airtel' | null
          payment_reference?: string | null
          waived_by?: string | null
          waiver_reason?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          member_id?: string
          category_id?: string | null
          amount?: number
          reason?: string | null
          status?: 'pending' | 'paid' | 'waived'
          paid_at?: string | null
          created_at?: string
          fine_ref?: string | null
          description?: string | null
          priority?: string
          due_date?: string | null
          payment_method?: 'cash' | 'mobile_money' | 'bank' | 'flutterwave' | 'mtn' | 'airtel' | null
          payment_reference?: string | null
          waived_by?: string | null
          waiver_reason?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      interest_rates: {
        Row: {
          id: string
          sacco_id: string
          min_amount: number
          max_amount: number
          rate: any
          rate_type: 'daily' | 'monthly' | 'annual'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          min_amount: number
          max_amount: number
          rate: any
          rate_type?: 'daily' | 'monthly' | 'annual'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          min_amount?: number
          max_amount?: number
          rate?: any
          rate_type?: 'daily' | 'monthly' | 'annual'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      loan_categories: {
        Row: {
          id: string
          sacco_id: string
          name: string
          description: string | null
          min_amount: number
          max_amount: number
          interest_rate: any
          max_duration_months: number | null
          requires_guarantor: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          name: string
          description?: string | null
          min_amount?: number
          max_amount: number
          interest_rate?: any
          max_duration_months?: number | null
          requires_guarantor?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          name?: string
          description?: string | null
          min_amount?: number
          max_amount?: number
          interest_rate?: any
          max_duration_months?: number | null
          requires_guarantor?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      loan_extensions: {
        Row: {
          id: string
          loan_id: string
          old_due_date: string
          new_due_date: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          old_due_date: string
          new_due_date: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          old_due_date?: string
          new_due_date?: string
          reason?: string | null
          created_at?: string
        }
      }
      loan_guarantors: {
        Row: {
          id: string
          loan_id: string
          member_id: string
          created_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          member_id: string
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          member_id?: string
          created_at?: string
        }
      }
      loan_top_ups: {
        Row: {
          id: string
          loan_id: string
          amount: number
          reason: string | null
          payment_method: 'cash' | 'mobile_money' | 'bank' | 'flutterwave' | 'mtn' | 'airtel'
          notes: string | null
          processed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          loan_id: string
          amount: number
          reason?: string | null
          payment_method?: 'cash' | 'mobile_money' | 'bank' | 'flutterwave' | 'mtn' | 'airtel'
          notes?: string | null
          processed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          loan_id?: string
          amount?: number
          reason?: string | null
          payment_method?: 'cash' | 'mobile_money' | 'bank' | 'flutterwave' | 'mtn' | 'airtel'
          notes?: string | null
          processed_by?: string | null
          created_at?: string
        }
      }
      loans: {
        Row: {
          id: string
          sacco_id: string
          member_id: string
          category_id: string | null
          loan_ref: string
          amount: number
          balance: number
          interest_rate: any
          status: 'pending' | 'verified' | 'approved' | 'declined' | 'disbursed' | 'active' | 'extended' | 'settled' | 'defaulted'
          due_date: string | null
          disbursed_at: string | null
          settled_at: string | null
          decline_reason: string | null
          notes: string | null
          created_at: string
          updated_at: string
          interest_rate_id: string | null
          expected_received: number
          interest_type: 'daily' | 'monthly' | 'annual'
          duration_months: number
          late_penalty_fee: number
          daily_payment: number
          monthly_payment: number
        }
        Insert: {
          id?: string
          sacco_id: string
          member_id: string
          category_id?: string | null
          loan_ref: string
          amount: number
          balance: number
          interest_rate?: any
          status?: 'pending' | 'verified' | 'approved' | 'declined' | 'disbursed' | 'active' | 'extended' | 'settled' | 'defaulted'
          due_date?: string | null
          disbursed_at?: string | null
          settled_at?: string | null
          decline_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          interest_rate_id?: string | null
          expected_received: number
          interest_type?: 'daily' | 'monthly' | 'annual'
          duration_months?: number
          late_penalty_fee?: number
          daily_payment?: number
          monthly_payment?: number
        }
        Update: {
          id?: string
          sacco_id?: string
          member_id?: string
          category_id?: string | null
          loan_ref?: string
          amount?: number
          balance?: number
          interest_rate?: any
          status?: 'pending' | 'verified' | 'approved' | 'declined' | 'disbursed' | 'active' | 'extended' | 'settled' | 'defaulted'
          due_date?: string | null
          disbursed_at?: string | null
          settled_at?: string | null
          decline_reason?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          interest_rate_id?: string | null
          expected_received?: number
          interest_type?: 'daily' | 'monthly' | 'annual'
          duration_months?: number
          late_penalty_fee?: number
          daily_payment?: number
          monthly_payment?: number
        }
      }
      members: {
        Row: {
          id: string
          sacco_id: string
          member_code: string
          full_name: string
          email: string | null
          phone: string | null
          national_id: string | null
          photo_url: string | null
          date_of_birth: string | null
          address: string | null
          next_of_kin: string | null
          next_of_kin_phone: string | null
          next_of_kin_relationship: string | null
          next_of_kin_address: string | null
          status: 'active' | 'suspended' | 'exited'
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          member_code: string
          full_name: string
          email?: string | null
          phone?: string | null
          national_id?: string | null
          photo_url?: string | null
          date_of_birth?: string | null
          address?: string | null
          next_of_kin?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          next_of_kin_address?: string | null
          status?: 'active' | 'suspended' | 'exited'
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          member_code?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          national_id?: string | null
          photo_url?: string | null
          date_of_birth?: string | null
          address?: string | null
          next_of_kin?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          next_of_kin_address?: string | null
          status?: 'active' | 'suspended' | 'exited'
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          sacco_id: string
          member_id: string | null
          title: string
          body: string
          type: 'sms' | 'in_app'
          status: 'pending' | 'sent' | 'failed'
          sent_at: string | null
          created_at: string
          priority: string
          channel: string
          recipient_phone: string | null
          recipient_email: string | null
          reference_type: string | null
          reference_id: string | null
          metadata: string
          retry_count: number
          max_retries: number
          error_message: string | null
          scheduled_at: string | null
          delivered_at: string | null
          read_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          member_id?: string | null
          title: string
          body: string
          type?: 'sms' | 'in_app'
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          created_at?: string
          priority?: string
          channel?: string
          recipient_phone?: string | null
          recipient_email?: string | null
          reference_type?: string | null
          reference_id?: string | null
          metadata?: string
          retry_count?: number
          max_retries?: number
          error_message?: string | null
          scheduled_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          member_id?: string | null
          title?: string
          body?: string
          type?: 'sms' | 'in_app'
          status?: 'pending' | 'sent' | 'failed'
          sent_at?: string | null
          created_at?: string
          priority?: string
          channel?: string
          recipient_phone?: string | null
          recipient_email?: string | null
          reference_type?: string | null
          reference_id?: string | null
          metadata?: string
          retry_count?: number
          max_retries?: number
          error_message?: string | null
          scheduled_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          updated_at?: string
        }
      }
      sacco_stats: {
        Row: {
          id: string
          sacco_id: string
          total_members: number
          active_members: number
          total_loans: number
          active_loans: number
          total_savings: number
          total_transactions: number
          total_fines: number
          pending_fines: number
          total_staff: number
          last_activity_at: string | null
          computed_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          total_members?: number
          active_members?: number
          total_loans?: number
          active_loans?: number
          total_savings?: number
          total_transactions?: number
          total_fines?: number
          pending_fines?: number
          total_staff?: number
          last_activity_at?: string | null
          computed_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          total_members?: number
          active_members?: number
          total_loans?: number
          active_loans?: number
          total_savings?: number
          total_transactions?: number
          total_fines?: number
          pending_fines?: number
          total_staff?: number
          last_activity_at?: string | null
          computed_at?: string
        }
      }
      sacco_users: {
        Row: {
          id: string
          sacco_id: string | null
          full_name: string
          email: string
          phone: string | null
          role: 'admin' | 'cashier' | 'field_agent'
          avatar_url: string | null
          is_active: boolean
          last_login_at: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          password_hash: string
          must_change_password: boolean
        }
        Insert: {
          id?: string
          sacco_id?: string | null
          full_name: string
          email: string
          phone?: string | null
          role?: 'admin' | 'cashier' | 'field_agent'
          avatar_url?: string | null
          is_active?: boolean
          last_login_at?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          password_hash: string
          must_change_password?: boolean
        }
        Update: {
          id?: string
          sacco_id?: string | null
          full_name?: string
          email?: string
          phone?: string | null
          role?: 'admin' | 'cashier' | 'field_agent'
          avatar_url?: string | null
          is_active?: boolean
          last_login_at?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          password_hash?: string
          must_change_password?: boolean
        }
      }
      saccos: {
        Row: {
          id: string
          name: string
          code: string | null
          logo_url: string | null
          primary_color: string
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          settings: string
          is_active: boolean
          created_at: string
          updated_at: string
          onboarding_completed: boolean
          website: string | null
          registration_number: string | null
          slug: string | null
          country: string
          status: 'active' | 'suspended' | 'trial' | 'cancelled'
          plan: string
          trial_ends_at: string | null
          subscription_ends_at: string | null
          notes: string | null
          created_by_cms: string | null
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          logo_url?: string | null
          primary_color?: string
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          settings?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          onboarding_completed?: boolean
          website?: string | null
          registration_number?: string | null
          slug?: string | null
          country?: string
          status?: 'active' | 'suspended' | 'trial' | 'cancelled'
          plan?: string
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          notes?: string | null
          created_by_cms?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          logo_url?: string | null
          primary_color?: string
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          settings?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          onboarding_completed?: boolean
          website?: string | null
          registration_number?: string | null
          slug?: string | null
          country?: string
          status?: 'active' | 'suspended' | 'trial' | 'cancelled'
          plan?: string
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          notes?: string | null
          created_by_cms?: string | null
        }
      }
      savings_accounts: {
        Row: {
          id: string
          sacco_id: string
          member_id: string
          category_id: string | null
          account_number: string
          balance: number
          account_type: 'regular' | 'fixed'
          is_locked: boolean
          lock_until: string | null
          lock_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          member_id: string
          category_id?: string | null
          account_number: string
          balance?: number
          account_type?: 'regular' | 'fixed'
          is_locked?: boolean
          lock_until?: string | null
          lock_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          member_id?: string
          category_id?: string | null
          account_number?: string
          balance?: number
          account_type?: 'regular' | 'fixed'
          is_locked?: boolean
          lock_until?: string | null
          lock_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      savings_categories: {
        Row: {
          id: string
          sacco_id: string
          name: string
          description: string | null
          interest_rate: any
          is_fixed: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          name: string
          description?: string | null
          interest_rate?: any
          is_fixed?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          name?: string
          description?: string | null
          interest_rate?: any
          is_fixed?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      superadmins: {
        Row: {
          id: string
          full_name: string
          email: string
          password_hash: string
          role: 'superadmin' | 'support'
          avatar_url: string | null
          is_active: boolean
          last_login_at: string | null
          last_login_ip: string | null
          two_fa_enabled: boolean
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          password_hash: string
          role?: 'superadmin' | 'support'
          avatar_url?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_login_ip?: string | null
          two_fa_enabled?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          password_hash?: string
          role?: 'superadmin' | 'support'
          avatar_url?: string | null
          is_active?: boolean
          last_login_at?: string | null
          last_login_ip?: string | null
          two_fa_enabled?: boolean
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          sacco_id: string
          member_id: string
          type: 'loan_disbursement' | 'loan_repayment' | 'savings_deposit' | 'savings_withdrawal' | 'fine_payment'
          amount: number
          balance_after: number | null
          reference_id: string | null
          payment_method: 'cash' | 'mobile_money' | 'bank' | 'flutterwave' | 'mtn' | 'airtel'
          narration: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sacco_id: string
          member_id: string
          type: 'loan_disbursement' | 'loan_repayment' | 'savings_deposit' | 'savings_withdrawal' | 'fine_payment'
          amount: number
          balance_after?: number | null
          reference_id?: string | null
          payment_method?: 'cash' | 'mobile_money' | 'bank' | 'flutterwave' | 'mtn' | 'airtel'
          narration?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sacco_id?: string
          member_id?: string
          type?: 'loan_disbursement' | 'loan_repayment' | 'savings_deposit' | 'savings_withdrawal' | 'fine_payment'
          amount?: number
          balance_after?: number | null
          reference_id?: string | null
          payment_method?: 'cash' | 'mobile_money' | 'bank' | 'flutterwave' | 'mtn' | 'airtel'
          narration?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      complaint_status: 'open' | 'in_progress' | 'resolved'
      document_type: 'national_id' | 'registration_form' | 'loan_contract' | 'membership_certificate' | 'other'
      fine_status: 'pending' | 'paid' | 'waived'
      interest_type: 'daily' | 'monthly' | 'annual'
      loan_status: 'pending' | 'verified' | 'approved' | 'declined' | 'disbursed' | 'active' | 'extended' | 'settled' | 'defaulted'
      member_status: 'active' | 'suspended' | 'exited'
      notification_status: 'pending' | 'sent' | 'failed'
      notification_type: 'sms' | 'in_app'
      payment_method: 'cash' | 'mobile_money' | 'bank' | 'flutterwave' | 'mtn' | 'airtel'
      sacco_status: 'active' | 'suspended' | 'trial' | 'cancelled'
      sacco_user_role: 'admin' | 'cashier' | 'field_agent'
      savings_account_type: 'regular' | 'fixed'
      superadmin_role: 'superadmin' | 'support'
      transaction_type: 'loan_disbursement' | 'loan_repayment' | 'savings_deposit' | 'savings_withdrawal' | 'fine_payment'
      user_role: 'admin' | 'cashier' | 'field_agent'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}