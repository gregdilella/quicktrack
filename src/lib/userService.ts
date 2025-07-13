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
        console.log('🔍 Checking if user exists for email:', email.toLowerCase())
        const { data, error } = await supabase
            .from('user_table')
            .select('email')
            .eq('email', email.toLowerCase())
            .maybeSingle()

        if (error) {
            console.error('❌ Error checking if user exists:', error)
            // If there's an error checking, assume user doesn't exist to allow signup attempt
            return false
        }

        console.log('📊 User check result - data:', data)
        console.log('📊 User exists:', data !== null)
        return data !== null
    } catch (error) {
        console.error('❌ Unexpected error checking user existence:', error)
        return false
    }
}

/**
 * Debug function to check user status across auth and database
 */
export async function debugUserStatus(email: string) {
    console.log('🔍 === DEBUGGING USER STATUS ===')
    console.log('📧 Email:', email)
    
    // Check if user exists in database
    const userInDatabase = await checkUserExistsByEmail(email)
    console.log('📊 User in database:', userInDatabase)
    
    // Try to get current auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔐 Current auth user:', user?.email || 'None')
    console.log('🔐 Auth error:', authError?.message || 'None')
    
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

        console.log('👤 Creating missing profile for user:', user.email)

        // Check if profile already exists
        const existingProfile = await getCurrentUserProfile()
        if (existingProfile) {
            console.log('✅ Profile already exists, no need to create')
            return existingProfile
        }

        // Create the missing profile
        const newProfile: CreateUserProfile = {
            user_id: user.id,
            email: user.email || '',
            role: 'Customer'
        }

        const createdProfile = await createUserProfile(newProfile)
        
        if (createdProfile) {
            console.log('✅ Successfully created missing user profile')
        } else {
            console.error('❌ Failed to create user profile')
        }

        return createdProfile
    } catch (error) {
        console.error('❌ Error creating missing user profile:', error)
        return null
    }
} 