// Authentication functions
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

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
        return { user: null, error }
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
    
    return session
} 