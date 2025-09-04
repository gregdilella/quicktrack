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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      airlines: {
        Row: {
          airline_code: string
          airline_name: string
          contact_email: string | null
          created_at: string | null
          iata_prefix: string | null
          id: number
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          airline_code: string
          airline_name: string
          contact_email?: string | null
          created_at?: string | null
          iata_prefix?: string | null
          id?: number
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          airline_code?: string
          airline_name?: string
          contact_email?: string | null
          created_at?: string | null
          iata_prefix?: string | null
          id?: number
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      awb: {
        Row: {
          airline_id: number
          awb_number: string
          cost: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          destination_airport: string | null
          destination_airport_code: string | null
          dimensions: string | null
          flight_date: string | null
          flight_duration_minutes: number | null
          flight_number: string | null
          id: string
          is_direct_flight: boolean | null
          jobno: string
          jobnumber: string
          notes: string | null
          origin_airport: string | null
          origin_airport_code: string | null
          pieces: number | null
          selected_flight_id: string | null
          status: string | null
          updated_at: string | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          airline_id: number
          awb_number: string
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          destination_airport?: string | null
          destination_airport_code?: string | null
          dimensions?: string | null
          flight_date?: string | null
          flight_duration_minutes?: number | null
          flight_number?: string | null
          id?: string
          is_direct_flight?: boolean | null
          jobno: string
          jobnumber: string
          notes?: string | null
          origin_airport?: string | null
          origin_airport_code?: string | null
          pieces?: number | null
          selected_flight_id?: string | null
          status?: string | null
          updated_at?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          airline_id?: number
          awb_number?: string
          cost?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          destination_airport?: string | null
          destination_airport_code?: string | null
          dimensions?: string | null
          flight_date?: string | null
          flight_duration_minutes?: number | null
          flight_number?: string | null
          id?: string
          is_direct_flight?: boolean | null
          jobno?: string
          jobnumber?: string
          notes?: string | null
          origin_airport?: string | null
          origin_airport_code?: string | null
          pieces?: number | null
          selected_flight_id?: string | null
          status?: string | null
          updated_at?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "awb_airline_id_fkey"
            columns: ["airline_id"]
            isOneToOne: false
            referencedRelation: "airlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "awb_jobno_fkey"
            columns: ["jobno"]
            isOneToOne: false
            referencedRelation: "jobsfile"
            referencedColumns: ["jobno"]
          },
          {
            foreignKeyName: "awb_jobnumber_fkey"
            columns: ["jobnumber"]
            isOneToOne: false
            referencedRelation: "jobsfile"
            referencedColumns: ["jobnumber"]
          },
        ]
      }
      billing: {
        Row: {
          charge: number | null
          chargecode: string | null
          created_at: string | null
          id: number
          jobnumber: string
        }
        Insert: {
          charge?: number | null
          chargecode?: string | null
          created_at?: string | null
          id?: number
          jobnumber: string
        }
        Update: {
          charge?: number | null
          chargecode?: string | null
          created_at?: string | null
          id?: number
          jobnumber?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_jobnumber_fkey"
            columns: ["jobnumber"]
            isOneToOne: false
            referencedRelation: "jobsfile"
            referencedColumns: ["jobnumber"]
          },
        ]
      }
      customers: {
        Row: {
          account_number: string | null
          address1: string | null
          billing_contact: string | null
          city: string | null
          contact_email: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          salesman_id: string | null
          state: string | null
          zip: string | null
        }
        Insert: {
          account_number?: string | null
          address1?: string | null
          billing_contact?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          salesman_id?: string | null
          state?: string | null
          zip?: string | null
        }
        Update: {
          account_number?: string | null
          address1?: string | null
          billing_contact?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          salesman_id?: string | null
          state?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_salesman_fkey"
            columns: ["salesman_id"]
            isOneToOne: false
            referencedRelation: "salesman"
            referencedColumns: ["id"]
          },
        ]
      }
      file_uploads: {
        Row: {
          content_type: string | null
          created_at: string
          description: string | null
          file_name: string | null
          id: string
          jobnumber: string
          r2_key: string
          size_bytes: number | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          id?: string
          jobnumber: string
          r2_key: string
          size_bytes?: number | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          id?: string
          jobnumber?: string
          r2_key?: string
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_jobnumber_fkey"
            columns: ["jobnumber"]
            isOneToOne: false
            referencedRelation: "jobsfile"
            referencedColumns: ["jobnumber"]
          },
        ]
      }
      jobsfile: {
        Row: {
          account_number: string | null
          bol_number: string | null
          commodity: string | null
          commodity_code: string | null
          consignee_address1: string | null
          consignee_address2: string | null
          consignee_city: string | null
          consignee_contact: string | null
          consignee_miles: number | null
          consignee_name: string | null
          consignee_phone: string | null
          consignee_state: string | null
          consignee_zip: string | null
          created_at: string | null
          created_by: string | null
          customer_account: string | null
          customer_contact: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          declared_value: number | null
          description: string | null
          dimensions: string | null
          equipment_type: string | null
          id: number
          is_dangerous_goods: boolean | null
          job_type: Database["public"]["Enums"]["job_type_enum"] | null
          jobno: string | null
          jobnumber: string
          packaging_id: string | null
          pieces: number | null
          po_number: string | null
          ready_date: string | null
          ready_time: string | null
          requires_outside_hours: boolean | null
          service_type: Database["public"]["Enums"]["service_type_enum"] | null
          shipper_address1: string | null
          shipper_address2: string | null
          shipper_city: string | null
          shipper_contact: string | null
          shipper_miles: number | null
          shipper_name: string | null
          shipper_phone: string | null
          shipper_state: string | null
          shipper_zip: string | null
          special_instructions: string | null
          status: Database["public"]["Enums"]["status_enum"] | null
          transport_mode: string | null
          updated_at: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type_enum"] | null
          vendorcode: string | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          account_number?: string | null
          bol_number?: string | null
          commodity?: string | null
          commodity_code?: string | null
          consignee_address1?: string | null
          consignee_address2?: string | null
          consignee_city?: string | null
          consignee_contact?: string | null
          consignee_miles?: number | null
          consignee_name?: string | null
          consignee_phone?: string | null
          consignee_state?: string | null
          consignee_zip?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_account?: string | null
          customer_contact?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          declared_value?: number | null
          description?: string | null
          dimensions?: string | null
          equipment_type?: string | null
          id?: number
          is_dangerous_goods?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type_enum"] | null
          jobno?: string | null
          jobnumber: string
          packaging_id?: string | null
          pieces?: number | null
          po_number?: string | null
          ready_date?: string | null
          ready_time?: string | null
          requires_outside_hours?: boolean | null
          service_type?: Database["public"]["Enums"]["service_type_enum"] | null
          shipper_address1?: string | null
          shipper_address2?: string | null
          shipper_city?: string | null
          shipper_contact?: string | null
          shipper_miles?: number | null
          shipper_name?: string | null
          shipper_phone?: string | null
          shipper_state?: string | null
          shipper_zip?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          transport_mode?: string | null
          updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type_enum"] | null
          vendorcode?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          account_number?: string | null
          bol_number?: string | null
          commodity?: string | null
          commodity_code?: string | null
          consignee_address1?: string | null
          consignee_address2?: string | null
          consignee_city?: string | null
          consignee_contact?: string | null
          consignee_miles?: number | null
          consignee_name?: string | null
          consignee_phone?: string | null
          consignee_state?: string | null
          consignee_zip?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_account?: string | null
          customer_contact?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          declared_value?: number | null
          description?: string | null
          dimensions?: string | null
          equipment_type?: string | null
          id?: number
          is_dangerous_goods?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type_enum"] | null
          jobno?: string | null
          jobnumber?: string
          packaging_id?: string | null
          pieces?: number | null
          po_number?: string | null
          ready_date?: string | null
          ready_time?: string | null
          requires_outside_hours?: boolean | null
          service_type?: Database["public"]["Enums"]["service_type_enum"] | null
          shipper_address1?: string | null
          shipper_address2?: string | null
          shipper_city?: string | null
          shipper_contact?: string | null
          shipper_miles?: number | null
          shipper_name?: string | null
          shipper_phone?: string | null
          shipper_state?: string | null
          shipper_zip?: string | null
          special_instructions?: string | null
          status?: Database["public"]["Enums"]["status_enum"] | null
          transport_mode?: string | null
          updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type_enum"] | null
          vendorcode?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobsfile_account_number_fkey"
            columns: ["account_number"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["account_number"]
          },
          {
            foreignKeyName: "jobsfile_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobsfile_packaging_fkey"
            columns: ["packaging_id"]
            isOneToOne: false
            referencedRelation: "packaging"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobsfile_vendorcode_fkey"
            columns: ["vendorcode"]
            isOneToOne: false
            referencedRelation: "lsps"
            referencedColumns: ["vendor_code"]
          },
        ]
      }
      lsp_costs: {
        Row: {
          cost: number
          created_at: string | null
          description: string | null
          id: string
          jobnumber: string | null
          ledgercode: string
          lsp_level_id: string | null
          vendorcode: string
        }
        Insert: {
          cost: number
          created_at?: string | null
          description?: string | null
          id?: string
          jobnumber?: string | null
          ledgercode: string
          lsp_level_id?: string | null
          vendorcode: string
        }
        Update: {
          cost?: number
          created_at?: string | null
          description?: string | null
          id?: string
          jobnumber?: string | null
          ledgercode?: string
          lsp_level_id?: string | null
          vendorcode?: string
        }
        Relationships: [
          {
            foreignKeyName: "lsp_costs_jobnumber_fkey"
            columns: ["jobnumber"]
            isOneToOne: false
            referencedRelation: "jobsfile"
            referencedColumns: ["jobnumber"]
          },
          {
            foreignKeyName: "lsp_costs_lsp_level_id_fkey"
            columns: ["lsp_level_id"]
            isOneToOne: false
            referencedRelation: "lsp_level"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lsp_costs_vendorcode_fkey"
            columns: ["vendorcode"]
            isOneToOne: false
            referencedRelation: "lsps"
            referencedColumns: ["vendor_code"]
          },
        ]
      }
      lsp_level: {
        Row: {
          assigned_date: string | null
          created_at: string | null
          function: string | null
          id: string
          jobnumber: string | null
          lsp_id: string | null
          status: string | null
          updated_at: string | null
          vehicle_type: string | null
          vendorcode: string | null
          waiting_time: number | null
        }
        Insert: {
          assigned_date?: string | null
          created_at?: string | null
          function?: string | null
          id?: string
          jobnumber?: string | null
          lsp_id?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          vendorcode?: string | null
          waiting_time?: number | null
        }
        Update: {
          assigned_date?: string | null
          created_at?: string | null
          function?: string | null
          id?: string
          jobnumber?: string | null
          lsp_id?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          vendorcode?: string | null
          waiting_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lsp_level_jobnumber_fkey"
            columns: ["jobnumber"]
            isOneToOne: false
            referencedRelation: "jobsfile"
            referencedColumns: ["jobnumber"]
          },
          {
            foreignKeyName: "lsp_level_lsp_id_fkey"
            columns: ["lsp_id"]
            isOneToOne: false
            referencedRelation: "lsps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lsp_level_vendorcode_fkey"
            columns: ["vendorcode"]
            isOneToOne: false
            referencedRelation: "lsps"
            referencedColumns: ["vendor_code"]
          },
        ]
      }
      lsps: {
        Row: {
          address: string | null
          contact_email: string | null
          created_at: string | null
          currency_code: string | null
          id: string
          mobile: string | null
          phone: string | null
          vendor_code: string | null
          vendor_name: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          created_at?: string | null
          currency_code?: string | null
          id?: string
          mobile?: string | null
          phone?: string | null
          vendor_code?: string | null
          vendor_name: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          created_at?: string | null
          currency_code?: string | null
          id?: string
          mobile?: string | null
          phone?: string | null
          vendor_code?: string | null
          vendor_name?: string
        }
        Relationships: []
      }
      packaging: {
        Row: {
          created_at: string | null
          id: string
          name: string
          temperature: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          temperature?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          temperature?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          charge: number | null
          chargecode: string | null
          created_at: string | null
          id: number
          jobnumber: string
        }
        Insert: {
          charge?: number | null
          chargecode?: string | null
          created_at?: string | null
          id?: number
          jobnumber: string
        }
        Update: {
          charge?: number | null
          chargecode?: string | null
          created_at?: string | null
          id?: number
          jobnumber?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_jobnumber_fkey"
            columns: ["jobnumber"]
            isOneToOne: false
            referencedRelation: "jobsfile"
            referencedColumns: ["jobnumber"]
          },
        ]
      }
      salesman: {
        Row: {
          email: string | null
          fin_cono: string | null
          id: string
          name: string
        }
        Insert: {
          email?: string | null
          fin_cono?: string | null
          id?: string
          name: string
        }
        Update: {
          email?: string | null
          fin_cono?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      timetable: {
        Row: {
          airport_dropoff: string | null
          created_at: string | null
          ddriver_delivery: string | null
          ddriver_dispatched: string | null
          ddriver_recovered: string | null
          estimated_airport_pickup: string | null
          estimated_cargo_ready: string | null
          estimated_delivery: string | null
          estimated_flight_arrival: string | null
          estimated_flight_departure: string | null
          flight_recovered: string | null
          flight_tenured: string | null
          id: number
          jobcreated: string | null
          jobno: string
          pdriver_arrived: string | null
          pdriver_dispatched: string | null
          pdriver_pickup: string | null
          pod: string | null
          updated_at: string | null
        }
        Insert: {
          airport_dropoff?: string | null
          created_at?: string | null
          ddriver_delivery?: string | null
          ddriver_dispatched?: string | null
          ddriver_recovered?: string | null
          estimated_airport_pickup?: string | null
          estimated_cargo_ready?: string | null
          estimated_delivery?: string | null
          estimated_flight_arrival?: string | null
          estimated_flight_departure?: string | null
          flight_recovered?: string | null
          flight_tenured?: string | null
          id?: number
          jobcreated?: string | null
          jobno: string
          pdriver_arrived?: string | null
          pdriver_dispatched?: string | null
          pdriver_pickup?: string | null
          pod?: string | null
          updated_at?: string | null
        }
        Update: {
          airport_dropoff?: string | null
          created_at?: string | null
          ddriver_delivery?: string | null
          ddriver_dispatched?: string | null
          ddriver_recovered?: string | null
          estimated_airport_pickup?: string | null
          estimated_cargo_ready?: string | null
          estimated_delivery?: string | null
          estimated_flight_arrival?: string | null
          estimated_flight_departure?: string | null
          flight_recovered?: string | null
          flight_tenured?: string | null
          id?: number
          jobcreated?: string | null
          jobno?: string
          pdriver_arrived?: string | null
          pdriver_dispatched?: string | null
          pdriver_pickup?: string | null
          pod?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_jobno_fkey"
            columns: ["jobno"]
            isOneToOne: false
            referencedRelation: "jobsfile"
            referencedColumns: ["jobno"]
          },
        ]
      }
      user_table: {
        Row: {
          created_at: string | null
          customer_id: string | null
          email: string
          id: string
          lsp_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          salesman_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          email: string
          id?: string
          lsp_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          salesman_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          email?: string
          id?: string
          lsp_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          salesman_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_table_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_table_lsp_id_fkey"
            columns: ["lsp_id"]
            isOneToOne: false
            referencedRelation: "lsps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_table_salesman_id_fkey"
            columns: ["salesman_id"]
            isOneToOne: false
            referencedRelation: "salesman"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_job_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role_secure: {
        Args: { user_uuid: string }
        Returns: string
      }
    }
    Enums: {
      job_type_enum: "web" | "email" | "placement" | "return" | "call"
      service_type_enum: "NFO" | "NDO" | "OBC" | "CHAR"
      status_enum:
        | "dispatch"
        | "live"
        | "delivered"
        | "billed"
        | "invoiced"
        | "collected"
      user_role:
        | "Admin"
        | "LSP"
        | "Management"
        | "Operations"
        | "Customer"
        | "Not-Assigned"
      vehicle_type_enum: "car" | "van" | "boxtruck"
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
    Enums: {
      job_type_enum: ["web", "email", "placement", "return", "call"],
      service_type_enum: ["NFO", "NDO", "OBC", "CHAR"],
      status_enum: [
        "dispatch",
        "live",
        "delivered",
        "billed",
        "invoiced",
        "collected",
      ],
      user_role: [
        "Admin",
        "LSP",
        "Management",
        "Operations",
        "Customer",
        "Not-Assigned",
      ],
      vehicle_type_enum: ["car", "van", "boxtruck"],
    },
  },
} as const
