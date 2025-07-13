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
			}
		}
	)

	// Get the current session from cookies
	event.locals.getSession = async () => {
		const accessToken = event.cookies.get('sb-access-token')
		const refreshToken = event.cookies.get('sb-refresh-token')

		console.log('Checking session cookies:', {
			hasAccessToken: !!accessToken,
			hasRefreshToken: !!refreshToken,
			path: event.url.pathname
		})

		if (!accessToken || !refreshToken) {
			console.log('No auth tokens found in cookies')
			return null
		}

		try {
			const { data: { session }, error } = await supabaseAuth.auth.setSession({
				access_token: accessToken,
				refresh_token: refreshToken
			})

			if (error) {
				console.error('Session restoration error:', error)
				return null
			}

			console.log('Session restored successfully:', {
				userId: session?.user?.id,
				email: session?.user?.email
			})

			return session
		} catch (error) {
			console.error('Error setting session:', error)
			return null
		}
	}

	// Get current session
	const session = await event.locals.getSession()

	// Define protected routes (routes that require authentication)
	const protectedRoutes = ['/dashboard']
	
	// Check if the current route is protected
	const isProtectedRoute = protectedRoutes.some(route => 
		event.url.pathname.startsWith(route)
	)

	// AUTH GUARD: If trying to access a protected route without authentication, redirect to login
	if (isProtectedRoute && !session) {
		console.log('Auth Guard: Redirecting unauthenticated user to login', {
			path: event.url.pathname,
			hasSession: !!session
		})
		throw redirect(302, '/')
	}

	// ROLE-BASED ACCESS CONTROL: Handle authenticated users accessing dashboard routes
	if (session && event.url.pathname.startsWith('/dashboard')) {
		console.log('Processing dashboard access for user:', session.user.id)
		
		// Get user role from database
		const { data: userProfile, error: dbError } = await event.locals.supabase
			.from('user_table')
			.select('role')
			.eq('user_id', session.user.id)
			.single()

		if (dbError) {
			console.error('Database error fetching user profile:', dbError)
			throw redirect(302, '/dashboard/customer')
		}

		const userRole = userProfile?.role || 'Customer'
		console.log('User role determined:', {
			userId: session.user.id,
			role: userRole,
			requestedPath: event.url.pathname
		})

		// Admin access: Admins can access any dashboard
		if (userRole === 'Admin') {
			console.log('✅ Admin access granted to:', event.url.pathname)
			// Admins can access any dashboard - no redirect needed
		} else {
			// Non-admin access: Check if they're accessing the correct dashboard
			const correctDashboard = getRoleDashboard(userRole)
			
			// If they're not on their correct dashboard, redirect them
			if (event.url.pathname !== correctDashboard) {
				console.log(`🔄 Redirecting ${userRole} from ${event.url.pathname} to ${correctDashboard}`)
				throw redirect(302, correctDashboard)
			} else {
				console.log(`✅ Correct dashboard access for ${userRole}:`, event.url.pathname)
			}
		}
	}

	// If already authenticated and trying to access login page, redirect to appropriate dashboard
	if (session && event.url.pathname === '/') {
		try {
			const { data: userProfile } = await event.locals.supabase
				.from('user_table')
				.select('role')
				.eq('user_id', session.user.id)
				.single()

			const userRole = userProfile?.role || 'Customer'
			const dashboardRoute = getRoleDashboard(userRole)
			
			console.log(`Redirecting authenticated ${userRole} to ${dashboardRoute}`)
			throw redirect(302, dashboardRoute)
		} catch (error) {
			console.error('Error getting user role for redirect:', error)
			throw redirect(302, '/dashboard')
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