// Authentication functions
import { supabase } from './supabase'
import { browser } from '$app/environment'
import { checkUserExistsByEmail, getCurrentUserProfile, createMissingUserProfile } from './userService'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from './types'

/**
 * Store auth tokens in cookies for server-side access
 */
function storeAuthTokens(accessToken: string | null, refreshToken: string | null) {
    if (!browser) return
    
    if (accessToken && refreshToken) {
        // Store tokens in cookies with proper settings for server-side access
        const cookieOptions = `path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax; secure=${window.location.protocol === 'https:'}`
        
        document.cookie = `sb-access-token=${accessToken}; ${cookieOptions}`
        document.cookie = `sb-refresh-token=${refreshToken}; ${cookieOptions}`
    } else {
        // Clear tokens
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })
    
    if (error) {
        console.error('Sign up error:', error)
        return { user: null, error }
    }
    
    // Store tokens if sign up was successful and user is confirmed
    if (data.session?.access_token && data.session?.refresh_token) {
        storeAuthTokens(data.session.access_token, data.session.refresh_token)
    }
    
    return { user: data.user, error: null }
}

/**
 * Sign in existing user
 */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    
    if (error) {
        console.error('Sign in error:', error)
        console.error('Error message:', error.message)
        console.error('Error code:', error.status)
        return { user: null, error }
    }
    
    // Store tokens for server-side access
    if (data.session?.access_token && data.session?.refresh_token) {
        storeAuthTokens(data.session.access_token, data.session.refresh_token)
    }
    
    // Check if user has a profile in the database, create one if missing
    if (data.user) {
        try {
            const profile = await getCurrentUserProfile()
            if (!profile) {
                await createMissingUserProfile()
            }
        } catch (error) {
            console.error('Error checking/creating user profile:', error)
            // Don't fail sign-in if profile creation fails, just log it
        }
    }
    
    return { user: data.user, error: null }
}

/**
 * Sign out current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
        console.error('Sign out error:', error)
        return { error }
    }
    
    // Clear stored tokens
    storeAuthTokens(null, null)
    
    return { error: null }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
        console.error('Get user error:', error)
        return null
    }
    
    return user
}

/**
 * Get current session
 */
export async function getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
        console.error('Get session error:', error)
        return null
    }
    
    // Update stored tokens if session exists
    if (session?.access_token && session?.refresh_token) {
        storeAuthTokens(session.access_token, session.refresh_token)
    }
    
    return session
}

/**
 * Unified signup or login function
 * Try sign in first, then fall back to signup if user doesn't exist
 */
export async function signupOrLogin(email: string, password: string) {
    try {
        // First, always try to sign in (most common case)
        const signInResult = await signIn(email, password)
        
        if (signInResult.user) {
            return signInResult
        }
        
        // If sign in failed, check the error
        if (signInResult.error) {
            // If the error is "Invalid login credentials", it could mean:
            // 1. Wrong password for existing user, OR
            // 2. User doesn't exist in auth yet
            if (signInResult.error.message.includes('Invalid login credentials')) {
                // Try to sign up - if user exists in auth, this will fail appropriately
                // If user doesn't exist in auth, this will create them
                const signUpResult = await signUp(email, password)
                
                if (signUpResult.user) {
                    return signUpResult
                } else if (signUpResult.error) {
                    // Check if the signup failed because user already exists
                    if (signUpResult.error.message.includes('User already registered') || 
                        signUpResult.error.message.includes('already been registered')) {
                        return {
                            user: null,
                            error: {
                                message: 'Invalid email or password. If you already have an account, please check your password.'
                            }
                        }
                    } else {
                        return signUpResult
                    }
                }
            } else {
                // Other sign in errors (email not confirmed, etc.)
                return signInResult
            }
        }
        
        // Fallback - shouldn't reach here
        return signInResult
    } catch (error) {
        console.error('❌ Error in signupOrLogin:', error)
        return { 
            user: null, 
            error: { message: 'An unexpected error occurred. Please try again.' }
        }
    }
}

/**
 * Get user role and determine appropriate dashboard route
 */
export async function getUserDashboardRoute(): Promise<string> {
    try {
        const userProfile = await getCurrentUserProfile()
        
        if (!userProfile || !userProfile.role) {
            // Default to customer dashboard if no role found
            return '/dashboard/customer'
        }

        // Normalize role and route based on user role (case-insensitive)
        const normalizedRole = String(userProfile.role).toLowerCase()
        switch (normalizedRole) {
            case 'admin':
                return '/dashboard/admin'
            case 'management':
                return '/dashboard/management'
            case 'operations':
                return '/dashboard/operations'
            case 'lsp':
                return '/dashboard/lsp'
            case 'customer':
                return '/dashboard/customer'
            case 'not-assigned':
                return '/waiting-for-assignment'
            default:
                return '/dashboard/customer'
        }
    } catch (error) {
        console.error('Error getting user role:', error)
        return '/dashboard/customer' // Default fallback
    }
}

/**
 * Check if user is authenticated (utility function)
 */
export async function isAuthenticated(): Promise<boolean> {
	try {
		const user = await getCurrentUser()
		const session = await getCurrentSession()
		return !!(user && session)
	} catch (error) {
		console.error('Authentication check error:', error)
		return false
	}
}

/**
 * Ensure user is authenticated, redirect to login if not
 */
export async function requireAuth(): Promise<boolean> {
	const authenticated = await isAuthenticated()
	if (!authenticated) {
		if (browser) {
			window.location.href = '/'
		}
		return false
	}
	return true
}