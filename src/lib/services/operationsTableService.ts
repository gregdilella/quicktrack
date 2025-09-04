import { supabase } from '$lib/supabase';
import type { Database } from '$lib/types/supabase.types';

// Types for our operations table
export type JobsFileRow = Database['public']['Tables']['jobsfile']['Row'];
export type TimetableRow = Database['public']['Tables']['timetable']['Row'];

export interface JobWithTimeline {
	jobsfile: JobsFileRow;
	timetable: TimetableRow | null;
	currentStage: string;
}

// Define the stages grouped into 4 rows
export const TIMELINE_STAGES_GROUPED = {
	dispatch: [
		{ key: 'jobcreated', label: 'Job Created', field: 'jobcreated' },
		{ key: 'ready', label: 'Ready Date', field: 'ready_date' }
	],
	pickup: [
		{ key: 'pdriver_dispatched', label: 'Pickup Driver Dispatched', field: 'pdriver_dispatched' },
		{ key: 'pdriver_arrived', label: 'Pickup Driver Arrived', field: 'pdriver_arrived' },
		{ key: 'pdriver_pickup', label: 'Pickup Completed', field: 'pdriver_pickup' }
	],
	airport: [
		{ key: 'airport_dropoff', label: 'Airport Dropoff', field: 'airport_dropoff' },
		{ key: 'flight_tenured', label: 'Flight Departure', field: 'flight_tenured' },
		{ key: 'flight_recovered', label: 'Flight Arrival', field: 'flight_recovered' }
	],
	delivery: [
		{ key: 'ddriver_dispatched', label: 'Delivery Driver Dispatched', field: 'ddriver_dispatched' },
		{ key: 'ddriver_recovered', label: 'Delivery Driver Recovered', field: 'ddriver_recovered' },
		{ key: 'pod', label: 'Proof of Delivery', field: 'pod' }
	]
} as const;

// Flatten all stages for backwards compatibility
export const TIMELINE_STAGES = [
	...TIMELINE_STAGES_GROUPED.dispatch,
	...TIMELINE_STAGES_GROUPED.pickup,
	...TIMELINE_STAGES_GROUPED.airport,
	...TIMELINE_STAGES_GROUPED.delivery
] as const;

/**
 * Determine the current stage of a job based on its timeline data
 */
function getCurrentStage(job: JobsFileRow, timeline: TimetableRow | null): string {
	// Start from the end and work backwards to find the most recent completed stage
	for (let i = TIMELINE_STAGES.length - 1; i >= 0; i--) {
		const stage = TIMELINE_STAGES[i];
		
		if (stage.key === 'ready') {
			// Special case for ready date - check the jobsfile table
			if (job.ready_date) {
				// If we have a ready date but no further progress, this is the current stage
				if (!timeline || !timeline.jobcreated) {
					return stage.key;
				}
			}
		} else if (timeline && (timeline as any)[stage.field]) {
			// If this stage is complete, check if the next stage is started
			const nextStageIndex = i + 1;
			if (nextStageIndex < TIMELINE_STAGES.length) {
				const nextStage = TIMELINE_STAGES[nextStageIndex];
				if (nextStage.key === 'ready' || !(timeline as any)[nextStage.field]) {
					// Next stage is not started, so current stage is the next one to be completed
					return TIMELINE_STAGES[nextStageIndex].key;
				}
			} else {
				// This is the final stage and it's complete
				return 'completed';
			}
		}
	}
	
	// If no stages are complete, the job is waiting for ready date
	return 'ready';
}

/**
 * Fetch all active jobs with their timeline data
 * Active jobs are those that have a status other than 'Completed', 'Delivered', or 'Cancelled'
 */
export async function getActiveJobsWithTimeline(): Promise<JobWithTimeline[]> {
	try {
		// First get all jobs that are considered active
		const { data: jobs, error: jobsError } = await supabase
			.from('jobsfile')
			.select('*')
			.not('status', 'in', '("delivered","billed","invoiced","collected")')
			.order('created_at', { ascending: false });

		if (jobsError) {
			console.error('Error fetching active jobs:', jobsError);
			return [];
		}

		if (!jobs || jobs.length === 0) {
			return [];
		}

		// Get all timetable entries for these jobs using jobno
		const jobNumbers = jobs.map(job => job.jobno || job.jobnumber);
		const { data: timelines, error: timelinesError } = await supabase
			.from('timetable')
			.select('*')
			.in('jobno', jobNumbers);

		if (timelinesError) {
			console.error('Error fetching timelines:', timelinesError);
			// Continue without timeline data
		}

		// Create a map of jobno to timeline for easy lookup
		const timelineMap = new Map<string, TimetableRow>();
		if (timelines) {
			timelines.forEach(timeline => {
				timelineMap.set(timeline.jobno, timeline);
			});
		}

		// Combine jobs with their timelines and determine current stage
		const jobsWithTimeline: JobWithTimeline[] = jobs.map(job => {
			const jobIdentifier = job.jobno || job.jobnumber;
			const timeline = timelineMap.get(jobIdentifier) || null;
			const currentStage = getCurrentStage(job, timeline);
			
			return {
				jobsfile: job,
				timetable: timeline,
				currentStage
			};
		});

		return jobsWithTimeline;
	} catch (error) {
		console.error('Error in getActiveJobsWithTimeline:', error);
		return [];
	}
}

/**
 * Check if a date is today
 */
function isToday(dateString: string | null): boolean {
	if (!dateString) return false;
	
	const today = new Date();
	const checkDate = new Date(dateString);
	
	return today.getFullYear() === checkDate.getFullYear() &&
		   today.getMonth() === checkDate.getMonth() &&
		   today.getDate() === checkDate.getDate();
}

/**
 * Group jobs by their current stage for table display
 */
export function groupJobsByStage(jobs: JobWithTimeline[]): Record<string, JobWithTimeline[]> {
	const groupedJobs: Record<string, JobWithTimeline[]> = {};
	
	// Initialize all stages with empty arrays
	TIMELINE_STAGES.forEach(stage => {
		groupedJobs[stage.key] = [];
	});
	groupedJobs['completed'] = [];

	// Group jobs by their current stage
	jobs.forEach(job => {
		const stage = job.currentStage;
		
		// Special handling for ready date - only show if ready date is today
		if (stage === 'ready') {
			if (isToday(job.jobsfile.ready_date)) {
				groupedJobs[stage].push(job);
			}
			// If ready date is not today, don't show the job in any column yet
			return;
		}
		
		if (!groupedJobs[stage]) {
			groupedJobs[stage] = [];
		}
		groupedJobs[stage].push(job);
	});

	return groupedJobs;
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(timestamp: string | null): string {
	if (!timestamp) return '';
	
	try {
		const date = new Date(timestamp);
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	} catch (error) {
		console.error('Error formatting timestamp:', error);
		return '';
	}
}
