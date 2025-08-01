// Simple auth test - bypasses all profile creation
import { supabase } from './supabase'

/**
 * Test signup without any profile creation
 */
export async function testSimpleSignup(email: string, password: string) {
    console.log('🧪 Testing simple signup without profile creation...')
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: undefined // Disable email confirmation redirect
            }
        })
        
        if (error) {
            console.error('Simple signup failed:', error)
            return { success: false, error: error.message }
        }
        
        return { success: true, data }
        
    } catch (err) {
        console.error('Unexpected error in simple signup:', err)
        return { success: false, error: 'Unexpected error occurred' }
    }
} 