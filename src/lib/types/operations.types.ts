import type { Database } from './supabase.types';

// AWB (Air Waybill) Types
export type AWB = {
	id: string;
	awb_number: string;
	airline_id: number;
	jobnumber: string;
	pieces?: number | null;
	weight?: number | null;
	weight_unit?: string | null;
	dimensions?: string | null;
	cost?: number | null;
	currency?: string | null;
	flight_number?: string | null;
	flight_date?: string | null;
	origin_airport?: string | null;
	destination_airport?: string | null;
	status?: string | null;
	notes?: string | null;
	created_at?: string | null;
	updated_at?: string | null;
	created_by?: string | null;
};

export type AWBInsert = Omit<AWB, 'id' | 'created_at' | 'updated_at'>;
export type AWBUpdate = Partial<Omit<AWB, 'id' | 'created_at' | 'updated_at'>>;

// LSP Level Types - Match actual database schema
export type LSPLevel = {
	id: string;
	jobnumber?: string | null;
	lsp_id?: string | null;
	vendorcode?: string | null;
	function?: string | null;
	status?: string | null;
	vehicle_type?: string | null;
	waiting_time?: number | null;
	assigned_date?: string | null;
	created_at?: string | null;
	updated_at?: string | null;
};

export type LSPLevelInsert = Omit<LSPLevel, 'id' | 'created_at' | 'updated_at'>;
export type LSPLevelUpdate = Partial<Omit<LSPLevel, 'id' | 'created_at' | 'updated_at'>>;

// Enhanced types with relationships
export type AWBWithAirline = AWB & {
	airlines?: Database['public']['Tables']['airlines']['Row'] | null;
};

export type LSPLevelWithLSP = LSPLevel & {
	lsps?: Database['public']['Tables']['lsps']['Row'] | null;
};

// Form data types for the UI
export type AWBFormData = {
	awb_number: string;
	airline_id: number;
	pieces?: number;
	weight?: number;
	weight_unit?: 'kg' | 'lbs';
	dimensions?: string;
	cost?: number;
	currency?: string;
	flight_number?: string;
	flight_date?: string;
	origin_airport?: string;
	destination_airport?: string;
	notes?: string;
};

export type LSPAssignmentFormData = {
	lsp_id: string;
	function: 'Pickup' | 'Delivery' | 'Transport' | 'Customs';
};

// Constants for dropdowns
export const LSP_FUNCTIONS = [
	{ value: 'Pickup', label: 'Pickup Service' },
	{ value: 'Delivery', label: 'Delivery Service' },
	{ value: 'Transport', label: 'Transportation' },
	{ value: 'Customs', label: 'Customs Clearance' }
] as const;

export const LSP_STATUSES = [
	{ value: 'Assigned', label: 'Assigned' },
	{ value: 'Dispatched', label: 'Dispatched' },
	{ value: 'In Progress', label: 'In Progress' },
	{ value: 'Completed', label: 'Completed' },
	{ value: 'Cancelled', label: 'Cancelled' }
] as const;

export const AWB_STATUSES = [
	{ value: 'Created', label: 'Created' },
	{ value: 'Confirmed', label: 'Confirmed' },
	{ value: 'In Transit', label: 'In Transit' },
	{ value: 'Delivered', label: 'Delivered' },
	{ value: 'Cancelled', label: 'Cancelled' }
] as const;

export const WEIGHT_UNITS = [
	{ value: 'kg', label: 'Kilograms (kg)' },
	{ value: 'lbs', label: 'Pounds (lbs)' }
] as const;

export const CURRENCIES = [
	{ value: 'USD', label: 'US Dollar (USD)' },
	{ value: 'EUR', label: 'Euro (EUR)' },
	{ value: 'GBP', label: 'British Pound (GBP)' },
	{ value: 'CAD', label: 'Canadian Dollar (CAD)' }
] as const;

// LSP Costs Types
export type LSPCost = {
	id: string;
	lsp_level_id?: string | null;
	jobnumber?: string | null;
	vendorcode: string;
	ledgercode: string;
	cost: number;
	description?: string | null;
	created_at?: string | null;
};

export type LSPCostInsert = Omit<LSPCost, 'id' | 'created_at'>;
export type LSPCostUpdate = Partial<Omit<LSPCost, 'id' | 'created_at'>>;

export type LSPCostFormData = {
	cost: number;
	description: string;
	ledgercode: string;
};
