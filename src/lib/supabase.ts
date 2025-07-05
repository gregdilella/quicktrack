import { createClient } from '@supabase/supabase-js'
import { browser } from '$app/environment'

// Get environment variables
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

// Debug logging (only in development and browser)
if (import.meta.env.DEV && browser) {
	console.log('Environment check:', {
		url: supabaseUrl ? 'Set' : 'Missing',
		key: supabaseAnonKey ? 'Set' : 'Missing',
		browser: browser
	})
}

// Validate required environment variables
if (!supabaseUrl) {
	console.error('PUBLIC_SUPABASE_URL is not set in environment variables')
}

if (!supabaseAnonKey) {
	console.error('PUBLIC_SUPABASE_ANON_KEY is not set in environment variables')
}

// Create Supabase client only in browser environment
export const supabase = browser && supabaseUrl && supabaseAnonKey 
	? createClient(supabaseUrl, supabaseAnonKey)
	: createClient('https://placeholder.supabase.co', 'placeholder-key') 