<!-- Add New Salesman - Management -->
<script lang="ts">
    import { onMount } from 'svelte'
    import { goto } from '$app/navigation'
    import { getCurrentUser, signOut } from '$lib/auth'
    import { getCurrentUserProfile } from '$lib/userService'
    import { supabase } from '$lib/supabase'
    import type { User } from '@supabase/supabase-js'
    import type { UserProfile } from '$lib/types'

    let user: User | null = null
    let userProfile: UserProfile | null = null
    let loading = false
    let saving = false
    let message = ''
    let validationErrors: Record<string, string> = {}

    let form = {
        name: '',
        email: '',
        fin_cono: ''
    }

    onMount(async () => {
        user = await getCurrentUser()
        if (user) {
            try {
                userProfile = await getCurrentUserProfile()
            } catch (error) {
                console.error('Error loading user profile:', error)
            }
        }
    })

    async function handleSignOut() {
        loading = true
        const { error } = await signOut()
        if (error) {
            console.error('Sign out error:', error)
        } else {
            goto('/')
        }
        loading = false
    }

    function validate() {
        validationErrors = {}
        if (!form.name.trim()) validationErrors.name = 'Name is required'
        if (!form.email.trim()) validationErrors.email = 'Email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) validationErrors.email = 'Enter a valid email'
        return Object.keys(validationErrors).length === 0
    }

    async function handleSubmit() {
        if (!validate()) {
            message = 'Please fix the validation errors below'
            return
        }

        try {
            saving = true
            message = ''

            const { data, error } = await supabase
                .from('salesman')
                .insert({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    fin_cono: form.fin_cono.trim() || null
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating salesman:', error)
                message = `Error creating salesman: ${error.message}`
                return
            }

            message = 'Salesman created successfully!'
            setTimeout(() => goto('/dashboard/management/salesman-search'), 1200)
        } catch (err) {
            console.error('Error in handleSubmit:', err)
            message = 'An unexpected error occurred. Please try again.'
        } finally {
            saving = false
        }
    }
</script>

<div class="terminal-container">
    <div class="main-content">
        <div class="ascii-header">
            <pre class="red-text">CCCCCC EEEEEEE RRRRRR TTTTTTTT UU   UU  SSSSS
CC     EE      RR   RR   TT    UU   UU SS    
CC     EE      RR   RR   TT    UU   UU SS    
CC     EEEE    RRRRRR    TT    UU   UU  SSSSS
CC     EEEE    RR RR     TT    UU   UU      SS
CC     EE      RR  RR    TT    UU   UU      SS
CCCCCC EEEEEEE RR   RR   TT     UUUUU   SSSSS</pre>
        </div>

        <div class="system-title">
            <span class="red-text">MANAGEMENT PORTAL - ADD NEW SALESMAN</span>
        </div>

        <div class="nav-section">
            <a href="/dashboard/management" class="nav-link">⬅ BACK TO MANAGEMENT MENU</a>
        </div>

        {#if user && userProfile}
            <div class="user-info">
                <p class="blue-text">Status: <span class="purple-text">MANAGEMENT ACCESS</span></p>
                <p class="blue-text">Function: SALESMAN REGISTRATION</p>
            </div>
        {/if}

        <div class="form-section">
            <h3 class="blue-text">--- NEW SALESMAN REGISTRATION ---</h3>
            <form on:submit|preventDefault={handleSubmit} class="customer-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="blue-text">NAME:</label>
                        <input type="text" bind:value={form.name} required class="form-input" class:error={validationErrors.name} />
                        {#if validationErrors.name}<span class="error-text">{validationErrors.name}</span>{/if}
                    </div>
                    <div class="form-group">
                        <label class="blue-text">EMAIL:</label>
                        <input type="email" bind:value={form.email} required class="form-input" class:error={validationErrors.email} />
                        {#if validationErrors.email}<span class="error-text">{validationErrors.email}</span>{/if}
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="blue-text">FIN CONO:</label>
                        <input type="text" bind:value={form.fin_cono} class="form-input" />
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="submit-button" disabled={saving}>
                        {saving ? 'CREATING SALESMAN...' : 'CREATE SALESMAN'}
                    </button>
                    <button type="button" on:click={() => goto('/dashboard/management')} class="cancel-button" disabled={saving}>CANCEL</button>
                </div>
            </form>

            {#if message}
                <div class="message" class:success={message.includes('success')} class:error={message.includes('error') || message.includes('fix')}>
                    {message}
                </div>
            {/if}
        </div>

        <div class="command-prompt">
            <span class="red-text">([MGMT] Salesman Registration Module - Ready for Input)</span>
        </div>

        <div class="logout-section">
            <button on:click={handleSignOut} disabled={loading} class="logout-button">
                {loading ? 'SIGNING OUT...' : 'LOGOUT'}
            </button>
        </div>
    </div>
    </div>

<style>
    .terminal-container { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.5; padding: 2rem; min-height: 100vh; box-sizing: border-box; }
    .main-content { max-width: 1000px; margin: 0 auto; }
    .ascii-header { margin-bottom: 2rem; background: white; padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
    .ascii-header pre { margin: 0; font-size: 12px; line-height: 1; font-family: 'Courier New', monospace; }
    .red-text { color: #ea580c; font-weight: 700; }
    .blue-text { color: #2563eb; font-weight: 600; }
    .purple-text { color: #7c3aed; font-weight: 600; }
    .system-title { margin: 2rem 0; text-align: center; background: white; padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
    .nav-section { margin: 2rem 0; text-align: center; }
    .nav-link { display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; text-decoration: none; font-size: 0.875rem; font-weight: 600; border-radius: 12px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(124,58,237,0.3); text-transform: uppercase; letter-spacing: 0.5px; }
    .nav-link:hover { background: linear-gradient(135deg, #6d28d9, #5b21b6); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(124,58,237,0.4); }
    .user-info { margin: 2rem 0; background: white; padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
    .user-info p { margin: 0.5rem 0; font-size: 0.95rem; }
    .form-section { margin: 2rem 0; padding: 2.5rem; border-radius: 20px; background: white; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }
    .form-section h3 { margin: 0 0 2rem 0; text-align: center; font-size: 1.5rem; color: #1f2937; text-transform: uppercase; letter-spacing: 1px; }
    .customer-form { display: flex; flex-direction: column; gap: 2rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: end; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-input { padding: 0.875rem 1rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.95rem; border: 2px solid #e5e7eb; background-color: white; border-radius: 12px; transition: all 0.3s ease; color: #1f2937; }
    .form-input:focus { outline: none; border-color: #ea580c; background-color: #fff7ed; box-shadow: 0 0 0 4px rgba(234,88,12,0.1); }
    .form-actions { display: flex; gap: 1.5rem; justify-content: center; margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid #e5e7eb; }
    .submit-button { padding: 1rem 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.95rem; background: linear-gradient(135deg, #16a34a, #15803d); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(22,163,74,0.3); min-width: 220px; }
    .submit-button:hover:not(:disabled) { background: linear-gradient(135deg, #15803d, #166534); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(22,163,74,0.4); }
    .cancel-button { padding: 1rem 2rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.95rem; background: linear-gradient(135deg, #6b7280, #4b5563); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(107,114,128,0.3); min-width: 140px; }
    .cancel-button:hover:not(:disabled) { background: linear-gradient(135deg, #4b5563, #374151); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(107,114,128,0.4); }
    .command-prompt { margin-top: 2rem; background: linear-gradient(135deg, #ea580c, #dc2626); color: white; padding: 1rem 1.5rem; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 15px rgba(234,88,12,0.3); text-align: center; }
    .logout-section { margin-top: 2rem; text-align: center; }
    .logout-button { padding: 0.75rem 1.5rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 0.875rem; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(220,38,38,0.3); }
    .logout-button:hover:not(:disabled) { background: linear-gradient(135deg, #b91c1c, #991b1b); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(220,38,38,0.4); }
    .form-input.error { border-color: #dc2626; background-color: #fef2f2; box-shadow: 0 0 0 4px rgba(220,38,38,0.1); }
    .error-text { color: #dc2626; font-size: 0.75rem; margin-top: 0.25rem; display: block; font-weight: 500; }
    @media (max-width: 768px) { .terminal-container { padding: 1rem; } .form-row { grid-template-columns: 1fr; gap: 1rem; } .form-section { padding: 1.5rem; } .form-actions { flex-direction: column; align-items: center; } .submit-button, .cancel-button { width: 100%; max-width: 320px; } }
</style>


