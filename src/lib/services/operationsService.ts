import { supabase } from '$lib/supabase';
import type { Database } from '$lib/types/supabase.types';
import type { 
	AWBWithAirline, 
	LSPLevel, 
	LSPLevelInsert, 
	LSPLevelWithLSP,
	AWBFormData,
	LSPAssignmentFormData,
	LSPCost,
	LSPCostInsert,
	LSPCostFormData
} from '$lib/types/operations.types';

// Use Database types for AWB operations
type AWB = Database['public']['Tables']['awb']['Row'];
type AWBInsert = Database['public']['Tables']['awb']['Insert'];

// Re-export types for easier importing
export type { AWBWithAirline, LSPLevelWithLSP };

export type Airline = Database['public']['Tables']['airlines']['Row'];
export type LSP = Database['public']['Tables']['lsps']['Row'];

/**
 * Get all airlines for dropdown selection
 */
export async function getAirlines(): Promise<Airline[]> {
	try {
		const { data, error } = await supabase
			.from('airlines')
			.select('*')
			.order('airline_name');

		if (error) {
			console.error('Error fetching airlines:', error);
			return [];
		}

		return data || [];
	} catch (error) {
		console.error('Error in getAirlines:', error);
		return [];
	}
}

/**
 * Get all LSPs for dropdown selection
 */
export async function getLSPs(): Promise<LSP[]> {
	try {
		const { data, error } = await supabase
			.from('lsps')
			.select('*')
			.order('vendor_name');

		if (error) {
			console.error('Error fetching LSPs:', error);
			return [];
		}

		return data || [];
	} catch (error) {
		console.error('Error in getLSPs:', error);
		return [];
	}
}

/**
 * Get AWBs for a specific job
 */
export async function getJobAWBs(jobno: string): Promise<AWBWithAirline[]> {
	try {
		const { data, error } = await supabase
			.from('awb')
			.select(`
				*,
				airlines (
					id,
					airline_name,
					airline_code,
					contact_email,
					phone
				)
			`)
			.eq('jobno', jobno)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching job AWBs:', error);
			return [];
		}

		return data || [];
	} catch (error) {
		console.error('Error in getJobAWBs:', error);
		return [];
	}
}

/**
 * Get LSP assignments for a specific job
 */
export async function getJobLSPs(jobno: string): Promise<LSPLevelWithLSP[]> {
	try {
		console.log('getJobLSPs called for jobno:', jobno);
		
		// First, let's check what's actually in the lsp_level table
		const { data: allLSPs, error: allError } = await supabase
			.from('lsp_level')
			.select('*');
		
		console.log('ALL LSP_LEVEL records in database:', allLSPs);
		
		const { data, error } = await supabase
			.from('lsp_level')
			.select(`
				*,
				lsps (
					id,
					vendor_name,
					vendor_code,
					contact_email,
					phone,
					address
				)
			`)
			.eq('jobnumber', jobnumber)
			.order('assigned_date', { ascending: false });

		console.log('getJobLSPs query details:', {
			searchingFor: jobno,
			queryResult: data,
			error: error,
			totalRecordsInTable: allLSPs?.length || 0
		});

		if (error) {
			console.error('Error fetching job LSPs:', error);
			return [];
		}

		console.log('getJobLSPs returning data:', data);
		return data || [];
	} catch (error) {
		console.error('Error in getJobLSPs:', error);
		return [];
	}
}

/**
 * Create a new AWB
 */
export async function createAWB(jobno: string, awbData: AWBFormData): Promise<{ success: boolean; awb?: AWB; error?: string }> {
	try {
		const insertData: AWBInsert = {
			...awbData,
			jobno,
			status: 'dispatch',
			created_by: (await supabase.auth.getUser()).data.user?.id || null
		};

		const { data, error } = await supabase
			.from('awb')
			.insert(insertData)
			.select()
			.single();

		if (error) {
			console.error('Error creating AWB:', error);
			return { success: false, error: error.message };
		}

		return { success: true, awb: data };
	} catch (error) {
		console.error('Error in createAWB:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

/**
 * Update an existing AWB
 */
export async function updateAWB(awbId: string, updates: Partial<AWBFormData>): Promise<{ success: boolean; awb?: AWB; error?: string }> {
	try {
		const { data, error } = await supabase
			.from('awb')
			.update(updates)
			.eq('id', awbId)
			.select()
			.single();

		if (error) {
			console.error('Error updating AWB:', error);
			return { success: false, error: error.message };
		}

		return { success: true, awb: data };
	} catch (error) {
		console.error('Error in updateAWB:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

/**
 * Delete an AWB
 */
export async function deleteAWB(awbId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const { error } = await supabase
			.from('awb')
			.delete()
			.eq('id', awbId);

		if (error) {
			console.error('Error deleting AWB:', error);
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (error) {
		console.error('Error in deleteAWB:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

/**
 * Assign LSP to a job
 */
export async function assignLSPToJob(jobnumber: string, lspData: LSPAssignmentFormData): Promise<{ success: boolean; assignment?: LSPLevel; error?: string }> {
	try {
		console.log('assignLSPToJob called with:', { jobnumber, lspData });
		
		// Get the LSP details to populate vendorcode
		const { data: lsp, error: lspError } = await supabase
			.from('lsps')
			.select('vendor_code')
			.eq('id', lspData.lsp_id)
			.single();

		console.log('LSP lookup result:', { lsp, lspError });

		if (lspError) {
			console.error('Error fetching LSP details:', lspError);
			return { success: false, error: `LSP not found: ${lspError.message}` };
		}

		if (!lsp || !lsp.vendor_code) {
			console.error('LSP found but no vendor_code:', lsp);
			return { success: false, error: 'LSP has no vendor code' };
		}

		const insertData: LSPLevelInsert = {
			jobnumber,
			lsp_id: lspData.lsp_id,
			vendorcode: lsp.vendor_code,
			function: lspData.function,
			status: 'dispatch',
			assigned_date: new Date().toISOString()
		};

		console.log('Inserting LSP assignment:', insertData);
		console.log('Job number being inserted:', jobnumber, 'Type:', typeof jobnumber);

		const { data, error } = await supabase
			.from('lsp_level')
			.insert(insertData)
			.select()
			.single();

		console.log('Insert result:', { data, error });

		if (error) {
			console.error('Error assigning LSP:', error);
			return { success: false, error: `Database error: ${error.message}` };
		}

		if (!data) {
			console.error('No data returned from insert');
			return { success: false, error: 'No data returned from database' };
		}

		console.log('LSP assignment successful:', data);
		return { success: true, assignment: data };
	} catch (error) {
		console.error('Error in assignLSPToJob:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

/**
 * Update LSP assignment
 */
export async function updateLSPAssignment(assignmentId: string, updates: Partial<LSPAssignmentFormData & { status?: string }>): Promise<{ success: boolean; assignment?: LSPLevel; error?: string }> {
	try {
		const { data, error } = await supabase
			.from('lsp_level')
			.update(updates)
			.eq('id', assignmentId)
			.select()
			.single();

		if (error) {
			console.error('Error updating LSP assignment:', error);
			return { success: false, error: error.message };
		}

		return { success: true, assignment: data };
	} catch (error) {
		console.error('Error in updateLSPAssignment:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

/**
 * Remove LSP assignment from job
 */
export async function removeLSPFromJob(assignmentId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const { error } = await supabase
			.from('lsp_level')
			.delete()
			.eq('id', assignmentId);

		if (error) {
			console.error('Error removing LSP assignment:', error);
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (error) {
		console.error('Error in removeLSPFromJob:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

/**
 * Get LSP costs for a job
 */
export async function getJobLSPCosts(jobnumber: string): Promise<Database['public']['Tables']['lsp_costs']['Row'][]> {
	try {
		const { data, error } = await supabase
			.from('lsp_costs')
			.select('*')
			.eq('jobnumber', jobnumber)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching LSP costs:', error);
			return [];
		}

		return data || [];
	} catch (error) {
		console.error('Error in getJobLSPCosts:', error);
		return [];
	}
}

/**
 * Get costs for a specific LSP assignment
 */
export async function getLSPCosts(lspLevelId: string): Promise<LSPCost[]> {
	try {
		const { data, error } = await supabase
			.from('lsp_costs')
			.select('*')
			.eq('lsp_level_id', lspLevelId)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error loading LSP costs:', error);
			return [];
		}

		return data || [];
	} catch (error) {
		console.error('Error in getLSPCosts:', error);
		return [];
	}
}

/**
 * Add a new cost to an LSP assignment
 */
export async function addLSPCost(lspLevelId: string, jobnumber: string, vendorcode: string, costData: LSPCostFormData): Promise<{ success: boolean; cost?: LSPCost; error?: string }> {
	try {
		console.log('Adding LSP cost:', { lspLevelId, jobnumber, vendorcode, costData });

		const insertData: LSPCostInsert = {
			lsp_level_id: lspLevelId,
			jobnumber: jobnumber,
			vendorcode: vendorcode,
			ledgercode: costData.ledgercode,
			cost: costData.cost,
			description: costData.description || null
		};

		const { data, error } = await supabase
			.from('lsp_costs')
			.insert(insertData)
			.select()
			.single();

		if (error) {
			console.error('Error adding LSP cost:', error);
			return { success: false, error: error.message };
		}

		console.log('LSP cost added successfully:', data);
		return { success: true, cost: data };
	} catch (error) {
		console.error('Error in addLSPCost:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

/**
 * Delete an LSP cost
 */
export async function deleteLSPCost(costId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const { error } = await supabase
			.from('lsp_costs')
			.delete()
			.eq('id', costId);

		if (error) {
			console.error('Error deleting LSP cost:', error);
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (error) {
		console.error('Error in deleteLSPCost:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}



/**
 * Update AWB status
 */
export async function updateAWBStatus(awbId: string, updates: { status: string }): Promise<{ success: boolean; awb?: AWB; error?: string }> {
	try {
		const { data, error } = await supabase
			.from('awb')
			.update(updates)
			.eq('id', awbId)
			.select()
			.single();

		if (error) {
			console.error('Error updating AWB status:', error);
			return { success: false, error: error.message };
		}

		return { success: true, awb: data };
	} catch (error) {
		console.error('Error in updateAWBStatus:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

/**
 * Update LSP assignment status
 */
export async function updateLSPStatus(assignmentId: string, updates: { status: string }): Promise<{ success: boolean; assignment?: LSPLevel; error?: string }> {
	try {
		const { data, error } = await supabase
			.from('lsp_level')
			.update(updates)
			.eq('id', assignmentId)
			.select()
			.single();

		if (error) {
			console.error('Error updating LSP status:', error);
			return { success: false, error: error.message };
		}

		return { success: true, assignment: data };
	} catch (error) {
		console.error('Error in updateLSPStatus:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

/**
 * Remove AWB
 */
export async function removeAWB(awbId: string): Promise<{ success: boolean; error?: string }> {
	try {
		const { error } = await supabase
			.from('awb')
			.delete()
			.eq('id', awbId);

		if (error) {
			console.error('Error removing AWB:', error);
			return { success: false, error: error.message };
		}

		return { success: true };
	} catch (error) {
		console.error('Error in removeAWB:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}
