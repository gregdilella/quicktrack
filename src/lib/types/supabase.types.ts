export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
          contact_email: string | null
          created_at: string | null
          id: string
          name: string
          account_number: string | null
          phone: string | null
          address1: string | null
          address2: string | null
          city: string | null
          state: string | null
          zip: string | null
          billing_contact: string | null
          payment_terms: string | null
          notes: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name: string
          account_number?: string | null
          phone?: string | null
          address1?: string | null
          address2?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          billing_contact?: string | null
          payment_terms?: string | null
          notes?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name?: string
          account_number?: string | null
          phone?: string | null
          address1?: string | null
          address2?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          billing_contact?: string | null
          payment_terms?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      flights: {
        Row: {
          cost: number | null
          created_at: string | null
          destination: string | null
          flight_no: string | null
          id: number
          jobnumber: string | null
          mawb: string | null
          origin: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          destination?: string | null
          flight_no?: string | null
          id?: number
          jobnumber?: string | null
          mawb?: string | null
          origin?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          destination?: string | null
          flight_no?: string | null
          id?: number
          jobnumber?: string | null
          mawb?: string | null
          origin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flights_jobnumber_fkey"
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
          weight_unit: string | null
          dimensions: string | null
          declared_value: number | null
          description: string | null
          consignee_address1: string | null
          consignee_address2: string | null
          consignee_city: string | null
          consignee_contact: string | null
          consignee_name: string | null
          consignee_phone: string | null
          consignee_state: string | null
          consignee_zip: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          customer_account: string | null
          customer_contact: string | null
          customer_phone: string | null
          customer_email: string | null
          id: number
          job_number: string | null
          job_type: string | null
          jobno: string | null
          jobnumber: string
          pieces: number | null
          po_number: string | null
          ready_date: string | null
          ready_time: string | null
          service_type: string | null
          transport_mode: string | null
          equipment_type: string | null
          service_level: string | null
          special_instructions: string | null
          shipper_address1: string | null
          shipper_address2: string | null
          shipper_city: string | null
          shipper_contact: string | null
          shipper_name: string | null
          shipper_phone: string | null
          shipper_state: string | null
          shipper_zip: string | null
          status: string | null
          updated_at: string | null
          vendorcode: string | null
          weight: number | null
        }
        Insert: {
          account_number?: string | null
          bol_number?: string | null
          commodity?: string | null
          commodity_code?: string | null
          weight_unit?: string | null
          dimensions?: string | null
          declared_value?: number | null
          description?: string | null
          consignee_address1?: string | null
          consignee_address2?: string | null
          consignee_city?: string | null
          consignee_contact?: string | null
          consignee_name?: string | null
          consignee_phone?: string | null
          consignee_state?: string | null
          consignee_zip?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_account?: string | null
          customer_contact?: string | null
          customer_phone?: string | null
          customer_email?: string | null
          id?: number
          job_number?: string | null
          job_type?: string | null
          jobno?: string | null
          jobnumber: string
          pieces?: number | null
          po_number?: string | null
          ready_date?: string | null
          ready_time?: string | null
          service_type?: string | null
          transport_mode?: string | null
          equipment_type?: string | null
          service_level?: string | null
          special_instructions?: string | null
          shipper_address1?: string | null
          shipper_address2?: string | null
          shipper_city?: string | null
          shipper_contact?: string | null
          shipper_name?: string | null
          shipper_phone?: string | null
          shipper_state?: string | null
          shipper_zip?: string | null
          status?: string | null
          updated_at?: string | null
          vendorcode?: string | null
          weight?: number | null
        }
        Update: {
          account_number?: string | null
          bol_number?: string | null
          commodity?: string | null
          commodity_code?: string | null
          weight_unit?: string | null
          dimensions?: string | null
          declared_value?: number | null
          description?: string | null
          consignee_address1?: string | null
          consignee_address2?: string | null
          consignee_city?: string | null
          consignee_contact?: string | null
          consignee_name?: string | null
          consignee_phone?: string | null
          consignee_state?: string | null
          consignee_zip?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_account?: string | null
          customer_contact?: string | null
          customer_phone?: string | null
          customer_email?: string | null
          id?: number
          job_number?: string | null
          job_type?: string | null
          jobno?: string | null
          jobnumber?: string
          pieces?: number | null
          po_number?: string | null
          ready_date?: string | null
          ready_time?: string | null
          service_type?: string | null
          transport_mode?: string | null
          equipment_type?: string | null
          service_level?: string | null
          special_instructions?: string | null
          shipper_address1?: string | null
          shipper_address2?: string | null
          shipper_city?: string | null
          shipper_contact?: string | null
          shipper_name?: string | null
          shipper_phone?: string | null
          shipper_state?: string | null
          shipper_zip?: string | null
          status?: string | null
          updated_at?: string | null
          vendorcode?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jobsfile_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobsfile_vendorcode_fkey"
            columns: ["vendorcode"]
            isOneToOne: false
            referencedRelation: "lsps"
            referencedColumns: ["vendorcode"]
          },
        ]
      }
      timetable: {
        Row: {
          id: number
          jobnumber: string
          jobcreated: string | null
          pdriver_dispatched: string | null
          pdriver_arrived: string | null
          pdriver_pickup: string | null
          airport_dropoff: string | null
          flight_tenured: string | null
          flight_recovered: string | null
          ddriver_dispatched: string | null
          ddriver_recovered: string | null
          ddriver_delivery: string | null
          pod: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          jobnumber: string
          jobcreated?: string | null
          pdriver_dispatched?: string | null
          pdriver_arrived?: string | null
          pdriver_pickup?: string | null
          airport_dropoff?: string | null
          flight_tenured?: string | null
          flight_recovered?: string | null
          ddriver_dispatched?: string | null
          ddriver_recovered?: string | null
          ddriver_delivery?: string | null
          pod?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          jobnumber?: string
          jobcreated?: string | null
          pdriver_dispatched?: string | null
          pdriver_arrived?: string | null
          pdriver_pickup?: string | null
          airport_dropoff?: string | null
          flight_tenured?: string | null
          flight_recovered?: string | null
          ddriver_dispatched?: string | null
          ddriver_recovered?: string | null
          ddriver_delivery?: string | null
          pod?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_jobnumber_fkey"
            columns: ["jobnumber"]
            isOneToOne: false
            referencedRelation: "jobsfile"
            referencedColumns: ["jobnumber"]
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
            referencedColumns: ["vendorcode"]
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
            referencedColumns: ["vendorcode"]
          },
        ]
      }
      lsps: {
        Row: {
          contact_email: string | null
          created_at: string | null
          id: string
          name: string
          vendorcode: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name: string
          vendorcode?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name?: string
          vendorcode?: string | null
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
          flight_recovered: string | null
          flight_tenured: string | null
          id: number
          jobcreated: string | null
          jobnumber: string
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
          flight_recovered?: string | null
          flight_tenured?: string | null
          id?: number
          jobcreated?: string | null
          jobnumber: string
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
          flight_recovered?: string | null
          flight_tenured?: string | null
          id?: number
          jobcreated?: string | null
          jobnumber?: string
          pdriver_arrived?: string | null
          pdriver_dispatched?: string | null
          pdriver_pickup?: string | null
          pod?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_jobnumber_fkey"
            columns: ["jobnumber"]
            isOneToOne: false
            referencedRelation: "jobsfile"
            referencedColumns: ["jobnumber"]
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
      user_role:
        | "Admin"
        | "LSP"
        | "Management"
        | "Operations"
        | "Customer"
        | "Not-Assigned"
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
      user_role: [
        "Admin",
        "LSP",
        "Management",
        "Operations",
        "Customer",
        "Not-Assigned",
      ],
    },
  },
} as const
