// User Service - Functions for interacting with user_table
import { supabase } from './supabase'
import type { UserProfile, CreateUserProfile, UpdateUserProfile } from './types'

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
    // First get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
        console.error('Error getting current user:', userError)
        return null
    }

    // Then get their profile from user_table using their ID
    const { data, error } = await supabase
        .from('user_table')
        .select('*')
        .eq('user_id', user.id)  // ✅ Filter by the current user's ID
        .maybeSingle()

    if (error) {
        console.error('Error fetching user profile:', error)
        return null
    }

    return data
}

/**
 * Get a user profile by user ID (only works if you have permission)
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('user_table')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

    if (error) {
        console.error('Error fetching user profile:', error)
        return null
    }

    return data
}

/**
 * Create a new user profile (usually done automatically by trigger)
 */
export async function createUserProfile(profile: CreateUserProfile): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('user_table')
        .insert(profile)
        .select()
        .single()

    if (error) {
        console.error('Error creating user profile:', error)
        return null
    }

    return data
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(updates: UpdateUserProfile): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('user_table')
        .update(updates)
        .select()
        .single()

    if (error) {
        console.error('Error updating user profile:', error)
        return null
    }

    return data
}

/**
 * Update a specific user's profile by their user_id (Admin only)
 */
export async function updateUserProfileById(userId: string, updates: UpdateUserProfile): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('user_table')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()

    if (error) {
        console.error('Error updating user profile by ID:', error)
        return null
    }

    return data
}

/**
 * Update a user's role (Admin only)
 */
export async function updateUserRole(userId: string, newRole: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('user_table')
            .update({ role: newRole })
            .eq('user_id', userId)

        if (error) {
            console.error('Error updating user role:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Error updating user role:', error)
        return false
    }
}

/**
 * Get all user profiles (only works for Admins due to RLS)
 */
export async function getAllUserProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase
        .from('user_table')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all user profiles:', error)
        return []
    }

    return data || []
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
    const profile = await getCurrentUserProfile()
    return profile?.role === 'Admin'
}

/**
 * Check if a user exists by email
 */
export async function checkUserExistsByEmail(email: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('user_table')
            .select('email')
            .eq('email', email.toLowerCase())
            .maybeSingle()

        if (error) {
            console.error('Error checking if user exists:', error)
            // If there's an error checking, assume user doesn't exist to allow signup attempt
            return false
        }

        return data !== null
    } catch (error) {
        console.error('Unexpected error checking user existence:', error)
        return false
    }
}

/**
 * Debug function to check user status across auth and database
 */
export async function debugUserStatus(email: string) {
    // Check if user exists in database
    const userInDatabase = await checkUserExistsByEmail(email)
    
    // Try to get current auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    return {
        userInDatabase,
        currentAuthUser: user,
        authError
    }
}

/**
 * Utility function to create a missing user profile
 * This can help fix cases where a user exists in auth but not in the database
 */
export async function createMissingUserProfile(): Promise<UserProfile | null> {
    try {
        // Get the current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            console.error('❌ No authenticated user found:', userError)
            return null
        }

        // Check if profile already exists
        const existingProfile = await getCurrentUserProfile()
        if (existingProfile) {
            return existingProfile
        }

        // Create the missing profile
        const newProfile: CreateUserProfile = {
            user_id: user.id,
            email: user.email || '',
            role: 'Not-Assigned'
        }

        const createdProfile = await createUserProfile(newProfile)
        
        if (!createdProfile) {
            console.error('Failed to create user profile')
        }

        return createdProfile
    } catch (error) {
        console.error('❌ Error creating missing user profile:', error)
        return null
    }
} 