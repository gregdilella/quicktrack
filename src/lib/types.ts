// Re-export Supabase database types with cleaner names
import type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './types/supabase.types'

// User-related types from the database
export type UserRole = Enums<'user_role'>
export type UserProfile = Tables<'user_table'>
export type CreateUserProfile = TablesInsert<'user_table'>
export type UpdateUserProfile = TablesUpdate<'user_table'>

// Export the full Database type for advanced usage
export type { Database } from './types/supabase.types'

// Export other commonly used table types
export type Customer = Tables<'customers'>
export type LSP = Tables<'lsps'>
export type Job = Tables<'jobsfile'>
export type Billing = Tables<'billing'>
export type Flight = Tables<'flights'>
export type Timetable = Tables<'timetable'>
export type LSPCost = Tables<'lsp_costs'>

// Export insert types for forms
export type CreateCustomer = TablesInsert<'customers'>
export type CreateLSP = TablesInsert<'lsps'>
export type CreateJob = TablesInsert<'jobsfile'>
export type CreateBilling = TablesInsert<'billing'>
export type CreateFlight = TablesInsert<'flights'>
export type CreateTimetable = TablesInsert<'timetable'>
export type CreateLSPCost = TablesInsert<'lsp_costs'>

// Export update types for editing
export type UpdateCustomer = TablesUpdate<'customers'>
export type UpdateLSP = TablesUpdate<'lsps'>
export type UpdateJob = TablesUpdate<'jobsfile'>
export type UpdateBilling = TablesUpdate<'billing'>
export type UpdateFlight = TablesUpdate<'flights'>
export type UpdateTimetable = TablesUpdate<'timetable'>
export type UpdateLSPCost = TablesUpdate<'lsp_costs'> 