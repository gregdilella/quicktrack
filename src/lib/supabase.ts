import { createClient } from '@supabase/supabase-js'
import { browser } from '$app/environment'

// Get environment variables with fallbacks for deployment
const supabaseUrl = typeof import.meta !== 'undefined' && import.meta.env 
	? import.meta.env.PUBLIC_SUPABASE_URL 
	: ''
const supabaseAnonKey = typeof import.meta !== 'undefined' && import.meta.env 
	? import.meta.env.PUBLIC_SUPABASE_ANON_KEY 
	: ''



// Validate required environment variables (only in browser/development)
if (browser && !supabaseUrl) {
	console.error('❌ PUBLIC_SUPABASE_URL is not set in environment variables')
	console.error('Please check your .env file and make sure it has PUBLIC_SUPABASE_URL')
}

if (browser && !supabaseAnonKey) {
	console.error('❌ PUBLIC_SUPABASE_ANON_KEY is not set in environment variables')
	console.error('Please check your .env file and make sure it has PUBLIC_SUPABASE_ANON_KEY')
}

// Create Supabase client with fallback for missing env vars
export const supabase = supabaseUrl && supabaseAnonKey 
	? createClient(supabaseUrl, supabaseAnonKey, {
		auth: {
			autoRefreshToken: true,
			persistSession: true
		}
	})
	: createClient('https://placeholder.supabase.co', 'placeholder-key', {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	}) 