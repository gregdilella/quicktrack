// User Service - Functions for interacting with user_table
import { supabase } from './supabase'
import type { UserProfile, CreateUserProfile, UpdateUserProfile } from './types'

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('user_table')
        .select('*')
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