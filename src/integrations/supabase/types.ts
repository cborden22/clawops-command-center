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
      lead_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          description: string
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          business_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          converted_location_id: string | null
          created_at: string
          estimated_machines: number | null
          estimated_revenue: number | null
          id: string
          next_follow_up: string | null
          notes: string | null
          priority: string | null
          source: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_location_id?: string | null
          created_at?: string
          estimated_machines?: number | null
          estimated_revenue?: number | null
          id?: string
          next_follow_up?: string | null
          notes?: string | null
          priority?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_location_id?: string | null
          created_at?: string
          estimated_machines?: number | null
          estimated_revenue?: number | null
          id?: string
          next_follow_up?: string | null
          notes?: string | null
          priority?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_location_id_fkey"
            columns: ["converted_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
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
          cost_per_play: number | null
          count: number | null
          custom_label: string | null
          id: string
          is_card_enabled: boolean | null
          last_nayax_sync: string | null
          location_id: string
          machine_type: string
          nayax_machine_id: string | null
          unit_code: string | null
          win_probability: number | null
        }
        Insert: {
          cost_per_play?: number | null
          count?: number | null
          custom_label?: string | null
          id?: string
          is_card_enabled?: boolean | null
          last_nayax_sync?: string | null
          location_id: string
          machine_type: string
          nayax_machine_id?: string | null
          unit_code?: string | null
          win_probability?: number | null
        }
        Update: {
          cost_per_play?: number | null
          count?: number | null
          custom_label?: string | null
          id?: string
          is_card_enabled?: boolean | null
          last_nayax_sync?: string | null
          location_id?: string
          machine_type?: string
          nayax_machine_id?: string | null
          unit_code?: string | null
          win_probability?: number | null
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
          collection_frequency_days: number | null
          commission_rate: number | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_collection_date: string | null
          name: string
          notes: string | null
          restock_day_of_week: number | null
          slug: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          collection_frequency_days?: number | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_collection_date?: string | null
          name: string
          notes?: string | null
          restock_day_of_week?: number | null
          slug?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          collection_frequency_days?: number | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_collection_date?: string | null
          name?: string
          notes?: string | null
          restock_day_of_week?: number | null
          slug?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      machine_collections: {
        Row: {
          coins_inserted: number
          collection_date: string
          created_at: string | null
          id: string
          location_id: string
          machine_id: string
          meter_reading_end: number | null
          meter_reading_start: number | null
          notes: string | null
          prizes_won: number
          revenue_entry_id: string | null
          user_id: string
        }
        Insert: {
          coins_inserted?: number
          collection_date?: string
          created_at?: string | null
          id?: string
          location_id: string
          machine_id: string
          meter_reading_end?: number | null
          meter_reading_start?: number | null
          notes?: string | null
          prizes_won?: number
          revenue_entry_id?: string | null
          user_id: string
        }
        Update: {
          coins_inserted?: number
          collection_date?: string
          created_at?: string | null
          id?: string
          location_id?: string
          machine_id?: string
          meter_reading_end?: number | null
          meter_reading_start?: number | null
          notes?: string | null
          prizes_won?: number
          revenue_entry_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "machine_collections_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_collections_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "location_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_collections_revenue_entry_id_fkey"
            columns: ["revenue_entry_id"]
            isOneToOne: false
            referencedRelation: "revenue_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          issue_type: string
          machine_id: string
          reporter_contact: string | null
          reporter_name: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          issue_type?: string
          machine_id: string
          reporter_contact?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          issue_type?: string
          machine_id?: string
          reporter_contact?: string | null
          reporter_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_reports_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "location_machines"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_entries: {
        Row: {
          completed_at: string | null
          created_at: string
          date: string
          end_location: string
          gps_distance_meters: number | null
          gps_end_lat: number | null
          gps_end_lng: number | null
          gps_start_lat: number | null
          gps_start_lng: number | null
          id: string
          is_round_trip: boolean
          location_id: string | null
          miles: number
          notes: string | null
          odometer_end: number | null
          odometer_start: number | null
          purpose: string | null
          route_id: string | null
          start_location: string
          started_at: string | null
          status: string | null
          tracking_mode: string | null
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          date?: string
          end_location: string
          gps_distance_meters?: number | null
          gps_end_lat?: number | null
          gps_end_lng?: number | null
          gps_start_lat?: number | null
          gps_start_lng?: number | null
          id?: string
          is_round_trip?: boolean
          location_id?: string | null
          miles: number
          notes?: string | null
          odometer_end?: number | null
          odometer_start?: number | null
          purpose?: string | null
          route_id?: string | null
          start_location: string
          started_at?: string | null
          status?: string | null
          tracking_mode?: string | null
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          date?: string
          end_location?: string
          gps_distance_meters?: number | null
          gps_end_lat?: number | null
          gps_end_lng?: number | null
          gps_start_lat?: number | null
          gps_start_lng?: number | null
          id?: string
          is_round_trip?: boolean
          location_id?: string | null
          miles?: number
          notes?: string | null
          odometer_end?: number | null
          odometer_start?: number | null
          purpose?: string | null
          route_id?: string | null
          start_location?: string
          started_at?: string | null
          status?: string | null
          tracking_mode?: string | null
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mileage_entries_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_entries_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "mileage_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_entries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_route_stops: {
        Row: {
          created_at: string
          custom_location_name: string | null
          id: string
          location_id: string | null
          miles_from_previous: number | null
          notes: string | null
          route_id: string
          stop_order: number
        }
        Insert: {
          created_at?: string
          custom_location_name?: string | null
          id?: string
          location_id?: string | null
          miles_from_previous?: number | null
          notes?: string | null
          route_id: string
          stop_order?: number
        }
        Update: {
          created_at?: string
          custom_location_name?: string | null
          id?: string
          location_id?: string | null
          miles_from_previous?: number | null
          notes?: string | null
          route_id?: string
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "mileage_route_stops_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "mileage_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_routes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_round_trip: boolean | null
          name: string
          next_scheduled_date: string | null
          schedule_day_of_week: number | null
          schedule_frequency_days: number | null
          total_miles: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_round_trip?: boolean | null
          name: string
          next_scheduled_date?: string | null
          schedule_day_of_week?: number | null
          schedule_frequency_days?: number | null
          total_miles?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_round_trip?: boolean | null
          name?: string
          next_scheduled_date?: string | null
          schedule_day_of_week?: number | null
          schedule_frequency_days?: number | null
          total_miles?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nayax_settings: {
        Row: {
          created_at: string
          id: string
          is_connected: boolean | null
          last_sync: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_sync?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_sync?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nayax_transactions: {
        Row: {
          amount: number
          id: string
          machine_id: string | null
          nayax_machine_id: string | null
          nayax_transaction_id: string
          payment_method: string | null
          raw_data: Json | null
          revenue_entry_id: string | null
          synced_at: string
          transaction_date: string
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          machine_id?: string | null
          nayax_machine_id?: string | null
          nayax_transaction_id: string
          payment_method?: string | null
          raw_data?: Json | null
          revenue_entry_id?: string | null
          synced_at?: string
          transaction_date: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          machine_id?: string | null
          nayax_machine_id?: string | null
          nayax_transaction_id?: string
          payment_method?: string | null
          raw_data?: Json | null
          revenue_entry_id?: string | null
          synced_at?: string
          transaction_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nayax_transactions_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "location_machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nayax_transactions_revenue_entry_id_fkey"
            columns: ["revenue_entry_id"]
            isOneToOne: false
            referencedRelation: "revenue_entries"
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
      user_schedules: {
        Row: {
          created_at: string
          day_of_week: number | null
          frequency_days: number | null
          id: string
          last_completed_date: string | null
          next_scheduled_date: string | null
          schedule_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          frequency_days?: number | null
          id?: string
          last_completed_date?: string | null
          next_scheduled_date?: string | null
          schedule_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          frequency_days?: number | null
          id?: string
          last_completed_date?: string | null
          next_scheduled_date?: string | null
          schedule_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          id: string
          last_recorded_odometer: number | null
          license_plate: string | null
          make: string | null
          model: string | null
          name: string
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_recorded_odometer?: number | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          name: string
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          last_recorded_odometer?: number | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          name?: string
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_machine_by_slug: {
        Args: { location_slug: string; machine_unit_code: string }
        Returns: {
          custom_label: string
          location_name: string
          machine_id: string
          machine_type: string
        }[]
      }
      get_machine_owner: { Args: { machine_uuid: string }; Returns: string }
      get_machine_public_info: {
        Args: { machine_uuid: string }
        Returns: {
          custom_label: string
          location_name: string
          machine_type: string
        }[]
      }
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
