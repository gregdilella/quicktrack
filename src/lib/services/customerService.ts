import { supabase } from '$lib/supabase';
import type { Database } from '$lib/types/supabase.types';

export type Customer = Database['public']['Tables']['customers']['Row'];
export type JobsFile = Database['public']['Tables']['jobsfile']['Row'];

/**
 * Get current user's customer information
 * This uses RLS to ensure users only get their own customer data
 */
export async function getCurrentUserCustomer(): Promise<Customer | null> {
	try {
		const { data: userProfile, error: userError } = await supabase
			.from('user_table')
			.select('customer_id')
			.single();

		if (userError) {
			console.error('Error fetching user profile:', userError);
			return null;
		}

		if (!userProfile?.customer_id) {
			return null;
		}

		const { data: customer, error: customerError } = await supabase
			.from('customers')
			.select('*')
			.eq('id', userProfile.customer_id)
			.single();

		if (customerError) {
			console.error('Error fetching customer:', customerError);
			return null;
		}

		return customer;
	} catch (error) {
		console.error('Error in getCurrentUserCustomer:', error);
		return null;
	}
}

/**
 * Get jobs for the current customer
 * Uses RLS to automatically filter by customer_id
 */
export async function getCurrentCustomerJobs(): Promise<JobsFile[]> {
	try {
		const { data: jobs, error } = await supabase
			.from('jobsfile')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching customer jobs:', error);
			return [];
		}

		return jobs || [];
	} catch (error) {
		console.error('Error in getCurrentCustomerJobs:', error);
		return [];
	}
}

/**
 * Search jobs for the current customer
 */
export async function searchCustomerJobs(searchTerm: string): Promise<JobsFile[]> {
	try {
		const { data: jobs, error } = await supabase
			.from('jobsfile')
			.select('*')
			.or(`jobnumber.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,commodity.ilike.%${searchTerm}%,shipper_name.ilike.%${searchTerm}%,consignee_name.ilike.%${searchTerm}%`)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error searching customer jobs:', error);
			return [];
		}

		return jobs || [];
	} catch (error) {
		console.error('Error in searchCustomerJobs:', error);
		return [];
	}
}

/**
 * Get a specific job by job number (customer can only access their own jobs due to RLS)
 */
export async function getCustomerJob(jobNumber: string): Promise<JobsFile | null> {
	try {
		const { data: job, error } = await supabase
			.from('jobsfile')
			.select('*')
			.eq('jobnumber', jobNumber)
			.single();

		if (error) {
			console.error('Error fetching job:', error);
			return null;
		}

		return job;
	} catch (error) {
		console.error('Error in getCustomerJob:', error);
		return null;
	}
}

/**
 * Create a new job for the current customer
 * Customer info will be auto-populated by the database trigger
 */
export async function createCustomerJob(jobData: Partial<JobsFile>): Promise<{ success: boolean; jobNumber?: string; error?: string }> {
	try {
		// Generate a job number if not provided
		const { data: jobNumber, error: jobNumberError } = await supabase
			.rpc('generate_job_number');

		if (jobNumberError) {
			console.error('Error generating job number:', jobNumberError);
			return { success: false, error: 'Failed to generate job number' };
		}

		const { data: newJob, error } = await supabase
			.from('jobsfile')
			.insert({
				...jobData,
				jobnumber: jobNumber,
				status: 'New',
				created_at: new Date().toISOString()
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating job:', error);
			return { success: false, error: error.message };
		}

		return { success: true, jobNumber: newJob.jobnumber };
	} catch (error) {
		console.error('Error in createCustomerJob:', error);
		return { success: false, error: 'Unexpected error occurred' };
	}
}

/**
 * Get customer job statistics
 */
export async function getCustomerJobStats(): Promise<{
	totalJobs: number;
	activeJobs: number;
	completedJobs: number;
	recentJobs: JobsFile[];
}> {
	try {
		const jobs = await getCurrentCustomerJobs();
		
		const totalJobs = jobs.length;
		const activeJobs = jobs.filter(job => 
			job.status && !['Completed', 'Delivered', 'Cancelled'].includes(job.status)
		).length;
		const completedJobs = jobs.filter(job => 
			job.status && ['Completed', 'Delivered'].includes(job.status)
		).length;
		const recentJobs = jobs.slice(0, 5); // Get 5 most recent jobs

		return {
			totalJobs,
			activeJobs,
			completedJobs,
			recentJobs
		};
	} catch (error) {
		console.error('Error in getCustomerJobStats:', error);
		return {
			totalJobs: 0,
			activeJobs: 0,
			completedJobs: 0,
			recentJobs: []
		};
	}
}
