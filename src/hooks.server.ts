import { redirect } from '@sveltejs/kit'
import type { Handle } from '@sveltejs/kit'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'

export const handle: Handle = async ({ event, resolve }) => {
	// Create Supabase client for session management (using anon key)
	const supabaseAuth = createClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		}
	)

	// Create Supabase client for server-side operations with service role
	event.locals.supabase = createClient(
		PUBLIC_SUPABASE_URL,
		SUPABASE_SERVICE_ROLE_KEY,
		{
			auth: {
				autoRefreshToken: false,
				persistSession: false
			},
			db: {
				schema: 'public'
			}
		}
	)

	// Get the current session from cookies
	event.locals.getSession = async () => {
		const accessToken = event.cookies.get('sb-access-token')
		const refreshToken = event.cookies.get('sb-refresh-token')

		if (!accessToken || !refreshToken) {
			return null
		}

		try {
			const { data: { session }, error } = await supabaseAuth.auth.setSession({
				access_token: accessToken,
				refresh_token: refreshToken
			})

			if (error) {
				// Handle invalid JWT tokens by clearing them
				if (error.message.includes('Invalid JWT') || error.code === 'invalid_jwt') {
					console.log('🧹 Clearing invalid JWT tokens from cookies')
					event.cookies.delete('sb-access-token', { path: '/' })
					event.cookies.delete('sb-refresh-token', { path: '/' })
				}
				return null
			}

			return session
		} catch (error) {
			console.error('Session restoration error:', error)
			return null
		}
	}

	// Get current session
	const session = await event.locals.getSession()

	// Define protected routes (routes that require authentication)
	const protectedRoutes = ['/dashboard', '/waiting-for-assignment']
	
	// Check if the current route is protected
	const isProtectedRoute = protectedRoutes.some(route => 
		event.url.pathname.startsWith(route)
	)

	// AUTH GUARD: If trying to access a protected route without authentication, redirect to login
	if (isProtectedRoute && !session) {
		throw redirect(302, '/')
	}

	// ROLE-BASED ACCESS CONTROL: Handle authenticated users accessing dashboard routes
	if (session && event.url.pathname.startsWith('/dashboard')) {
		// Get user role from database
		const { data: userProfile, error: dbError } = await event.locals.supabase
			.from('user_table')
			.select('role')
			.eq('user_id', session.user.id)
			.maybeSingle()

		if (dbError) {
			console.error('Database error fetching user profile:', dbError)
			throw redirect(302, '/dashboard/customer')
		}

		const userRole = userProfile?.role || 'Not-Assigned'

		// Not-Assigned users: Redirect to waiting page
		if (userRole === 'Not-Assigned') {
			throw redirect(302, '/waiting-for-assignment')
		}

		// Admin users can access any dashboard - no redirection needed
		if (userRole !== 'Admin') {
			// Non-admin users: Check if they're accessing their correct dashboard
			const correctDashboard = getRoleDashboard(userRole)
			
			// If they're not on their correct dashboard, redirect them
			if (event.url.pathname !== correctDashboard) {
				throw redirect(302, correctDashboard)
			}
		}
	}

	// If already authenticated and trying to access login page, redirect to appropriate dashboard
	if (session && event.url.pathname === '/') {
		try {
			const { data: userProfile, error: loginDbError } = await event.locals.supabase
				.from('user_table')
				.select('role')
				.eq('user_id', session.user.id)
				.maybeSingle()

			if (loginDbError) {
				throw redirect(302, '/dashboard/customer')
			}

			const userRole = userProfile?.role || 'Not-Assigned'
			
			if (userRole === 'Not-Assigned') {
				throw redirect(302, '/waiting-for-assignment')
			}
			
			const dashboardRoute = getRoleDashboard(userRole)
			throw redirect(302, dashboardRoute)
		} catch (error) {
			throw redirect(302, '/dashboard/customer')
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range'
		}
	})
}

/**
 * Get the correct dashboard route for a user role
 */
function getRoleDashboard(role: string): string {
	switch (role) {
		case 'Admin':
			return '/dashboard/admin'
		case 'Management':
			return '/dashboard/management'
		case 'Operations':
			return '/dashboard/operations'
		case 'LSP':
			return '/dashboard/lsp'
		case 'Customer':
		default:
			return '/dashboard/customer'
	}
} 