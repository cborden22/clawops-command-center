export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      commission_summaries: {
        Row: {
          commission_amount: number | null
          commission_percentage: number | null
          created_at: string | null
          end_date: string
          id: string
          location_id: string
          machine_count: number | null
          notes: string | null
          start_date: string
          total_revenue: number | null
        }
        Insert: {
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          end_date: string
          id?: string
          location_id: string
          machine_count?: number | null
          notes?: string | null
          start_date: string
          total_revenue?: number | null
        }
        Update: {
          commission_amount?: number | null
          commission_percentage?: number | null
          created_at?: string | null
          end_date?: string
          id?: string
          location_id?: string
          machine_count?: number | null
          notes?: string | null
          start_date?: string
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_summaries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          id: string
          last_price: number | null
          last_updated: string | null
          location: string | null
          min_stock: number | null
          name: string
          notes: string | null
          package_quantity: number | null
          package_type: string | null
          price_per_item: number | null
          quantity: number | null
          supplier_name: string | null
          supplier_url: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          id?: string
          last_price?: number | null
          last_updated?: string | null
          location?: string | null
          min_stock?: number | null
          name: string
          notes?: string | null
          package_quantity?: number | null
          package_type?: string | null
          price_per_item?: number | null
          quantity?: number | null
          supplier_name?: string | null
          supplier_url?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          id?: string
          last_price?: number | null
          last_updated?: string | null
          location?: string | null
          min_stock?: number | null
          name?: string
          notes?: string | null
          package_quantity?: number | null
          package_type?: string | null
          price_per_item?: number | null
          quantity?: number | null
          supplier_name?: string | null
          supplier_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      location_agreements: {
        Row: {
          agreement_date: string | null
          created_at: string | null
          end_date: string | null
          flat_fee_amount: number | null
          id: string
          location_id: string
          notice_period: string | null
          payment_method: string | null
          payment_type: string | null
          provider_address: string | null
          provider_contact: string | null
          provider_name: string | null
          revenue_share_percentage: number | null
          start_date: string | null
        }
        Insert: {
          agreement_date?: string | null
          created_at?: string | null
          end_date?: string | null
          flat_fee_amount?: number | null
          id?: string
          location_id: string
          notice_period?: string | null
          payment_method?: string | null
          payment_type?: string | null
          provider_address?: string | null
          provider_contact?: string | null
          provider_name?: string | null
          revenue_share_percentage?: number | null
          start_date?: string | null
        }
        Update: {
          agreement_date?: string | null
          created_at?: string | null
          end_date?: string | null
          flat_fee_amount?: number | null
          id?: string
          location_id?: string
          notice_period?: string | null
          payment_method?: string | null
          payment_type?: string | null
          provider_address?: string | null
          provider_contact?: string | null
          provider_name?: string | null
          revenue_share_percentage?: number | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_agreements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_machines: {
        Row: {
          count: number | null
          custom_label: string | null
          id: string
          location_id: string
          machine_type: string
        }
        Insert: {
          count?: number | null
          custom_label?: string | null
          id?: string
          location_id: string
          machine_type: string
        }
        Update: {
          count?: number | null
          custom_label?: string | null
          id?: string
          location_id?: string
          machine_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_machines_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          commission_rate: number | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mileage_entries: {
        Row: {
          created_at: string
          date: string
          end_location: string
          id: string
          is_round_trip: boolean
          location_id: string | null
          miles: number
          notes: string | null
          purpose: string | null
          start_location: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          end_location: string
          id?: string
          is_round_trip?: boolean
          location_id?: string | null
          miles: number
          notes?: string | null
          purpose?: string | null
          start_location: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_location?: string
          id?: string
          is_round_trip?: boolean
          location_id?: string | null
          miles?: number
          notes?: string | null
          purpose?: string | null
          start_location?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_entries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      revenue_entries: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          date: string
          id: string
          location_id: string | null
          machine_type: string | null
          notes: string | null
          receipt_url: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date: string
          id?: string
          location_id?: string | null
          machine_type?: string | null
          notes?: string | null
          receipt_url?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string
          id?: string
          location_id?: string | null
          machine_type?: string | null
          notes?: string | null
          receipt_url?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_entries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_run_history: {
        Row: {
          created_at: string
          id: string
          items: Json
          returned_items: Json | null
          run_date: string
          total_items: number
          total_products: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          returned_items?: Json | null
          run_date?: string
          total_items?: number
          total_products?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          returned_items?: Json | null
          run_date?: string
          total_items?: number
          total_products?: number
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          dashboard_layout: Json | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dashboard_layout?: Json | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dashboard_layout?: Json | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
