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
        // Store tokens in cookies with proper settings
        document.cookie = `sb-access-token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`
        document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`
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
                console.log('⚠️ User authenticated but no database profile found, creating one...')
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
        console.log('🔐 Attempting to sign in user...')
        const signInResult = await signIn(email, password)
        
        if (signInResult.user) {
            // Sign in successful
            console.log('✅ Sign in successful!')
            return signInResult
        }
        
        // If sign in failed, check the error
        if (signInResult.error) {
            console.log('❌ Sign in failed with error:', signInResult.error.message)
            
            // If the error is "Invalid login credentials", it could mean:
            // 1. Wrong password for existing user, OR
            // 2. User doesn't exist in auth yet
            if (signInResult.error.message.includes('Invalid login credentials')) {
                console.log('🔍 Invalid credentials - checking if this is a new user...')
                
                // Try to sign up - if user exists in auth, this will fail appropriately
                // If user doesn't exist in auth, this will create them
                console.log('👤 Attempting to create new account...')
                const signUpResult = await signUp(email, password)
                
                if (signUpResult.user) {
                    console.log('✅ New account created successfully!')
                    return signUpResult
                } else if (signUpResult.error) {
                    // Check if the signup failed because user already exists
                    if (signUpResult.error.message.includes('User already registered') || 
                        signUpResult.error.message.includes('already been registered')) {
                        console.log('🔄 User exists in auth but sign-in failed - likely wrong password')
                        return {
                            user: null,
                            error: {
                                message: 'Invalid email or password. If you already have an account, please check your password.'
                            }
                        }
                    } else {
                        console.log('❌ Signup failed:', signUpResult.error.message)
                        return signUpResult
                    }
                }
            } else {
                // Other sign in errors (email not confirmed, etc.)
                console.log('❌ Sign in failed with specific error:', signInResult.error.message)
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
            return '/dashboard'
        }

        // Route based on user role
        switch (userProfile.role) {
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
    } catch (error) {
        console.error('Error getting user role:', error)
        return '/dashboard' // Default fallback
    }
} 