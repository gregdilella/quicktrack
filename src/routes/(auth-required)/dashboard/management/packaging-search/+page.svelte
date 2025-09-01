<!-- Packaging Search - Management -->
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
    let searching = false
    let searchQuery = ''
    let rows: any[] = []
    let filtered: any[] = []

    onMount(async () => {
        user = await getCurrentUser()
        if (user) {
            try {
                userProfile = await getCurrentUserProfile()
                await load()
            } catch (error) {
                console.error('Error loading user profile:', error)
            }
        }
    })

    async function load() {
        try {
            searching = true
            const { data, error } = await supabase
                .from('packaging')
                .select('*')
                .order('name', { ascending: true })

            if (error) {
                console.error('Error loading packaging:', error)
                return
            }

            rows = data || []
            filtered = rows
        } catch (err) {
            console.error('Error in load:', err)
        } finally {
            searching = false
        }
    }

    function handleSearch() {
        if (!searchQuery.trim()) { filtered = rows; return }
        const q = searchQuery.toLowerCase().trim()
        filtered = rows.filter(r =>
            r.name?.toLowerCase().includes(q) ||
            r.type?.toLowerCase().includes(q) ||
            r.temperature?.toLowerCase().includes(q)
        )
    }

    async function handleSignOut() {
        loading = true
        const { error } = await signOut()
        if (error) { console.error('Sign out error:', error) } else { goto('/') }
        loading = false
    }

    $: if (searchQuery !== undefined) { handleSearch() }
</script>

<div class="search-container">
    <div class="main-content">
        <div class="header-section">
            <div class="header-content">
                <h1 class="page-title">Packaging Search</h1>
                <p class="page-subtitle">Find and manage packaging types</p>
            </div>
        </div>

        <div class="nav-section">
            <a href="/dashboard/management" class="nav-link">⬅ Back to Management</a>
            <a href="/dashboard/management/add-new-packaging" class="nav-link add-customer">+ Add New Packaging</a>
        </div>

        {#if user && userProfile}
            <div class="user-info">
                <p class="status-text">Status: <span class="highlight">Management Access</span></p>
                <p class="function-text">Function: Packaging Search & Management</p>
            </div>
        {/if}

        <div class="search-section">
            <div class="search-header">
                <h3>Search Packaging</h3>
                <div class="search-stats">{filtered.length} of {rows.length} packaging types</div>
            </div>
            <div class="search-controls">
                <div class="search-input-group">
                    <input type="text" bind:value={searchQuery} placeholder="Search by name, type, or temperature..." class="search-input" />
                    <button type="button" on:click={() => { searchQuery=''; handleSearch(); }} class="clear-button" class:visible={searchQuery.length>0}>Clear</button>
                </div>
            </div>
        </div>

        <div class="results-section">
            {#if searching}
                <div class="loading-state"><div class="loading-spinner"></div><p>Loading packaging...</p></div>
            {:else if filtered.length === 0 && rows.length > 0}
                <div class="empty-state"><div class="empty-icon">📦</div><h3>No packaging found</h3><p>Try different search terms</p></div>
            {:else if rows.length === 0}
                <div class="empty-state"><div class="empty-icon">📦</div><h3>No packaging yet</h3><p>Create your first packaging type</p><a href="/dashboard/management/add-new-packaging" class="empty-action">Add First Packaging</a></div>
            {:else}
                <div class="customers-grid">
                    {#each filtered as p (p.id)}
                        <div class="customer-card">
                            <div class="customer-header">
                                <h4 class="customer-name">{p.name}</h4>
                            </div>
                            <div class="customer-details">
                                {#if p.id}
                                    <div class="detail-row"><span class="detail-label">ID:</span><span class="detail-value">{p.id}</span></div>
                                {/if}
                                {#if p.type}
                                    <div class="detail-row"><span class="detail-label">Type:</span><span class="detail-value">{p.type}</span></div>
                                {/if}
                                {#if p.temperature}
                                    <div class="detail-row"><span class="detail-label">Temp:</span><span class="detail-value">{p.temperature}</span></div>
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <div class="logout-section"><button on:click={handleSignOut} disabled={loading} class="logout-button">{loading ? 'Signing Out...' : 'Logout'}</button></div>
    </div>
</div>

<style>
    .search-container { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-height: 100vh; padding: 2rem; }
    .main-content { max-width: 1200px; margin: 0 auto; }
    .header-section { background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; margin-bottom: 2rem; }
    .header-content { text-align: center; }
    .page-title { font-size: 2.5rem; font-weight: 700; color: #1f2937; margin: 0 0 0.5rem 0; background: linear-gradient(135deg, #ea580c, #dc2626); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .page-subtitle { font-size: 1.1rem; color: #6b7280; margin: 0; }
    .nav-section { display: flex; gap: 1rem; margin-bottom: 2rem; justify-content: space-between; align-items: center; }
    .nav-link { display: inline-block; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; text-decoration: none; font-size: 0.875rem; font-weight: 600; border-radius: 12px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(124,58,237,0.3); text-transform: uppercase; letter-spacing: 0.5px; }
    .nav-link:hover { background: linear-gradient(135deg, #6d28d9, #5b21b6); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(124,58,237,0.4); }
    .nav-link.add-customer { background: linear-gradient(135deg, #16a34a, #15803d); box-shadow: 0 4px 15px rgba(22,163,74,0.3); }
    .nav-link.add-customer:hover { background: linear-gradient(135deg, #15803d, #166534); box-shadow: 0 8px 25px rgba(22,163,74,0.4); }
    .user-info { background: white; padding: 1.5rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; margin-bottom: 2rem; }
    .status-text, .function-text { margin: 0.25rem 0; font-size: 0.95rem; color: #374151; }
    .highlight { color: #7c3aed; font-weight: 600; }
    .search-section { background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; margin-bottom: 2rem; }
    .search-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .search-header h3 { margin: 0; font-size: 1.5rem; color: #1f2937; font-weight: 600; }
    .search-stats { font-size: 0.875rem; color: #6b7280; font-weight: 500; }
    .search-input-group { display: flex; gap: 1rem; align-items: center; }
    .search-input { flex: 1; padding: 1rem 1.25rem; border: 2px solid #e5e7eb; border-radius: 12px; font-size: 1rem; transition: all 0.3s ease; background: white; }
    .search-input:focus { outline: none; border-color: #ea580c; box-shadow: 0 0 0 4px rgba(234,88,12,0.1); }
    .clear-button { padding: 1rem 1.5rem; background: linear-gradient(135deg, #6b7280, #4b5563); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; opacity: 0; transform: scale(0.9); }
    .clear-button.visible { opacity: 1; transform: scale(1); }
    .clear-button:hover { background: linear-gradient(135deg, #4b5563, #374151); transform: translateY(-1px); }
    .results-section { background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; margin-bottom: 2rem; min-height: 400px; }
    .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; }
    .loading-spinner { width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top: 4px solid #ea580c; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .customers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; padding: 2rem; }
    .customer-card { background: linear-gradient(135deg, #ffffff, #f8fafc); border: 2px solid #e5e7eb; border-radius: 16px; padding: 1.5rem; transition: all 0.3s ease; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .customer-card:hover { border-color: #ea580c; box-shadow: 0 8px 30px rgba(234,88,12,0.15); transform: translateY(-4px); }
    .customer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb; }
    .customer-name { font-size: 1.25rem; font-weight: 600; color: #1f2937; margin: 0; }
    .detail-row { display: flex; gap: 0.75rem; }
    .detail-label { font-weight: 600; color: #6b7280; min-width: 60px; font-size: 0.875rem; }
    .detail-value { color: #1f2937; font-size: 0.875rem; }
    .logout-section { text-align: center; margin-top: 2rem; }
    .logout-button { padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(220,38,38,0.3); }
    .logout-button:hover:not(:disabled) { background: linear-gradient(135deg, #b91c1c, #991b1b); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(220,38,38,0.4); }
    @media (max-width: 768px) { .search-container { padding: 1rem; } .customers-grid { grid-template-columns: 1fr; padding: 1rem; } .nav-section { flex-direction: column; gap: 0.75rem; } .search-input-group { flex-direction: column; } .clear-button { width: 100%; } .customer-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; } }
</style>


