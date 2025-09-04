<!-- Individual User Details - Management -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import { supabase } from '$lib/supabase'
	import * as Table from "$lib/components/ui/table"
	import { Button } from "$lib/components/ui/button"
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'

	let user: User | null = null
	let userProfile: UserProfile | null = null
	let loading = false
	let dataLoading = true
	let saving = false
	let userDetails: any = null
	let isEditing = false
	let message = ''
	let validationErrors: Record<string, string> = {}

	// Related data
	let customers: any[] = []
	let lsps: any[] = []
	let salesmen: any[] = []

	// Edit form data
	let editData = {
		email: '',
		role: 'Not-Assigned',
		customer_id: '',
		lsp_id: ''
	}

	// Get user ID from URL params
	$: userId = $page.params.id

	onMount(async () => {
		user = await getCurrentUser()
		if (user) {
			try {
				userProfile = await getCurrentUserProfile()
				if (userId) {
					await loadUserData()
					await loadRelatedData()
				}
			} catch (error) {
				console.error('Error loading user profile:', error)
			}
		}
	})

	async function loadUserData() {
		try {
			dataLoading = true
			
			// First, load basic user data
			const { data: userData, error: userError } = await supabase
				.from('user_table')
				.select('*')
				.eq('id', userId)
				.single()

			console.log('User data query result:', { userData, userError, userId });

			if (userError) {
				console.error('Error loading user:', userError)
				return
			}

			userDetails = userData
			
			// Load related data separately to avoid join issues
			await loadUserRelatedData(userData)
			
			// Populate edit form
			editData = {
				email: userData.email || '',
				role: userData.role || 'Not-Assigned',
				customer_id: userData.customer_id || '',
				lsp_id: userData.lsp_id || ''
			}

		} catch (err) {
			console.error('Error loading user data:', err)
		} finally {
			dataLoading = false
		}
	}

	async function loadUserRelatedData(userData: any) {
		try {
			// Load customer info if user has customer_id
			if (userData.customer_id) {
				const { data: customerData } = await supabase
					.from('customers')
					.select('id, name, account_number')
					.eq('id', userData.customer_id)
					.single()
				
				if (customerData) {
					userDetails.customers = customerData
				}
			}

			// Load LSP info if user has lsp_id
			if (userData.lsp_id) {
				const { data: lspData } = await supabase
					.from('lsps')
					.select('id, name, vendorcode')
					.eq('id', userData.lsp_id)
					.single()
				
				if (lspData) {
					userDetails.lsps = lspData
				}
			}

			// Load salesman info if user has salesman_id (only if salesman table exists)
			if (userData.salesman_id) {
				try {
					const { data: salesmanData } = await supabase
						.from('salesman')
						.select('id, name, fin_cono')
						.eq('id', userData.salesman_id)
						.single()
					
					if (salesmanData) {
						userDetails.salesman = salesmanData
					}
				} catch (salesmanErr) {
					console.log('Salesman table not accessible or does not exist:', salesmanErr)
				}
			}

		} catch (err) {
			console.error('Error loading user related data:', err)
		}
	}

	async function loadRelatedData() {
		try {
			// Load customers
			const { data: customersData, error: customersError } = await supabase
				.from('customers')
				.select('id, name, account_number')
				.order('name')

			if (!customersError) {
				customers = customersData || []
			} else {
				console.error('Error loading customers:', customersError)
			}

			// Load LSPs
			const { data: lspsData, error: lspsError } = await supabase
				.from('lsps')
				.select('id, name, vendorcode')
				.order('name')

			if (!lspsError) {
				lsps = lspsData || []
			} else {
				console.error('Error loading LSPs:', lspsError)
			}

			// Load salesmen (handle case where table might not exist or have access issues)
			try {
				const { data: salesmenData, error: salesmenError } = await supabase
					.from('salesman')
					.select('id, name, fin_cono')
					.order('name')

				if (!salesmenError) {
					salesmen = salesmenData || []
				} else {
					console.error('Error loading salesmen:', salesmenError)
				}
			} catch (salesmanErr) {
				console.log('Salesman table not accessible for dropdowns:', salesmanErr)
				salesmen = []
			}

		} catch (err) {
			console.error('Error loading related data:', err)
		}
	}

	async function handleSave() {
		if (userProfile?.role !== 'Admin') {
			message = 'Only administrators can edit user details'
			return
		}

		// Validation
		validationErrors = {}
		
		if (!editData.email.trim()) {
			validationErrors.email = 'Email is required'
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
			validationErrors.email = 'Please enter a valid email address'
		}

		if (Object.keys(validationErrors).length > 0) {
			message = 'Please fix the validation errors'
			return
		}

		try {
			saving = true
			message = ''

			const updateData: any = {
				email: editData.email.trim(),
				role: editData.role,
				updated_at: new Date().toISOString()
			}

			// Only include foreign keys if they have values
			if (editData.customer_id) {
				updateData.customer_id = editData.customer_id
			} else {
				updateData.customer_id = null
			}

			if (editData.lsp_id) {
				updateData.lsp_id = editData.lsp_id
			} else {
				updateData.lsp_id = null
			}

			const { data, error } = await supabase
				.from('user_table')
				.update(updateData)
				.eq('id', userId)
				.select('*')
				.single()

			if (error) {
				console.error('Error updating user:', error)
				message = `Error updating user: ${error.message}`
				return
			}

			userDetails = data
			await loadUserRelatedData(data) // Reload related data
			isEditing = false
			message = 'User updated successfully!'

			setTimeout(() => {
				message = ''
			}, 3000)

		} catch (err) {
			console.error('Error in handleSave:', err)
			message = 'An unexpected error occurred'
		} finally {
			saving = false
		}
	}

	function cancelEdit() {
		isEditing = false
		// Reset form data
		editData = {
			email: userDetails.email || '',
			role: userDetails.role || 'Not-Assigned',
			customer_id: userDetails.customer_id || '',
			lsp_id: userDetails.lsp_id || ''
		}
		validationErrors = {}
		message = ''
	}

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

	function formatDate(dateString: string | null): string {
		if (!dateString) return 'Never'
		return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString()
	}

	function getRoleColor(role: string): string {
		switch (role) {
			case 'Admin': return '#ef4444'
			case 'Management': return '#7c3aed'
			case 'Operations': return '#ea580c'
			case 'LSP': return '#2563eb'
			case 'Customer': return '#16a34a'
			default: return '#6b7280'
		}
	}
</script>

<div class="user-container">
	<div class="main-content">
		<!-- Header Section -->
		<div class="header-section">
			<div class="header-content">
				{#if dataLoading}
					<h1 class="page-title">Loading...</h1>
					<p class="page-subtitle">Loading user details</p>
				{:else if userDetails}
					<h1 class="page-title">{userDetails.email}</h1>
					<p class="page-subtitle">User Management Dashboard</p>
				{:else}
					<h1 class="page-title">User Not Found</h1>
					<p class="page-subtitle">The requested user could not be found</p>
				{/if}
			</div>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/management/users" class="nav-link">⬅ Back to Users</a>
			<a href="/dashboard/management" class="nav-link">Management Dashboard</a>
		</div>

		{#if user && userProfile}
			<div class="user-info">
				<p class="status-text">Status: <span class="highlight">Management Access</span></p>
				<p class="function-text">Function: User Account Management</p>
			</div>
		{/if}

		{#if message}
			<div class="message" class:success={message.includes('success')} class:error={message.includes('Error') || message.includes('error')}>
				{message}
			</div>
		{/if}

		{#if dataLoading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Loading user details...</p>
			</div>
		{:else if !userDetails}
			<div class="empty-state">
				<div class="empty-icon">❌</div>
				<h3>User Not Found</h3>
				<p>The requested user could not be found</p>
				<a href="/dashboard/management/users" class="empty-action">Return to Users</a>
			</div>
		{:else}
			<!-- User Details Table -->
			<div class="details-section">
				<div class="section-header">
					<h3>User Details</h3>
					{#if userProfile?.role === 'Admin'}
						<div class="header-actions">
							{#if isEditing}
								<Button onclick={handleSave} disabled={saving} class="save-btn">
									{saving ? 'Saving...' : 'Save Changes'}
								</Button>
								<Button onclick={cancelEdit} variant="outline" disabled={saving}>
									Cancel
								</Button>
							{:else}
								<Button onclick={() => isEditing = true} class="edit-btn">
									Edit User
								</Button>
							{/if}
						</div>
					{/if}
				</div>

				<div class="table-container">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>Value</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							<Table.Row>
								<Table.Cell class="font-medium">User ID</Table.Cell>
								<Table.Cell class="font-mono text-sm">{userDetails.user_id}</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell class="font-medium">Email</Table.Cell>
								<Table.Cell>
									{#if isEditing && userProfile?.role === 'Admin'}
										<input 
											type="email" 
											bind:value={editData.email}
											class="edit-input"
											class:error={validationErrors.email}
										/>
										{#if validationErrors.email}
											<div class="error-text">{validationErrors.email}</div>
										{/if}
									{:else}
										{userDetails.email}
									{/if}
								</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell class="font-medium">Role</Table.Cell>
								<Table.Cell>
									{#if isEditing && userProfile?.role === 'Admin'}
										<select bind:value={editData.role} class="edit-select">
											<option value="Admin">Admin</option>
											<option value="Management">Management</option>
											<option value="Operations">Operations</option>
											<option value="LSP">LSP</option>
											<option value="Customer">Customer</option>
											<option value="Not-Assigned">Not-Assigned</option>
										</select>
									{:else}
										<span class="role-badge" style="background-color: {getRoleColor(userDetails.role)};">
											{userDetails.role}
										</span>
									{/if}
								</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell class="font-medium">Customer</Table.Cell>
								<Table.Cell>
									{#if isEditing && userProfile?.role === 'Admin'}
										<select bind:value={editData.customer_id} class="edit-select">
											<option value="">No Customer</option>
											{#each customers as customer}
												<option value={customer.id}>
													{customer.name} {customer.account_number ? `(${customer.account_number})` : ''}
												</option>
											{/each}
										</select>
									{:else}
										{userDetails.customers?.name || 'None'}
										{#if userDetails.customers?.account_number}
											<span class="account-number">({userDetails.customers.account_number})</span>
										{/if}
									{/if}
								</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell class="font-medium">LSP</Table.Cell>
								<Table.Cell>
									{#if isEditing && userProfile?.role === 'Admin'}
										<select bind:value={editData.lsp_id} class="edit-select">
											<option value="">No LSP</option>
											{#each lsps as lsp}
												<option value={lsp.id}>
													{lsp.name} {lsp.vendorcode ? `(${lsp.vendorcode})` : ''}
												</option>
											{/each}
										</select>
									{:else}
										{userDetails.lsps?.name || 'None'}
										{#if userDetails.lsps?.vendorcode}
											<span class="vendor-code">({userDetails.lsps.vendorcode})</span>
										{/if}
									{/if}
								</Table.Cell>
							</Table.Row>

							<Table.Row>
								<Table.Cell class="font-medium">Created</Table.Cell>
								<Table.Cell>{formatDate(userDetails.created_at)}</Table.Cell>
							</Table.Row>
							<Table.Row>
								<Table.Cell class="font-medium">Last Updated</Table.Cell>
								<Table.Cell>{formatDate(userDetails.updated_at)}</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table.Root>
				</div>

				{#if userProfile?.role !== 'Admin'}
					<div class="access-notice">
						<p>👤 Only administrators can edit user details</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Logout Section -->
		<div class="logout-section">
			<button onclick={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'Signing Out...' : 'Logout'}
			</button>
		</div>
	</div>
</div>

<style>
	.user-container {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		min-height: 100vh;
		padding: 2rem;
	}

	.main-content {
		max-width: 1000px;
		margin: 0 auto;
	}

	/* Header Section */
	.header-section {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.header-content {
		text-align: center;
	}

	.page-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #1f2937;
		margin: 0 0 0.5rem 0;
		background: linear-gradient(135deg, #7c3aed, #6d28d9);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.page-subtitle {
		font-size: 1.1rem;
		color: #6b7280;
		margin: 0;
	}

	/* Navigation */
	.nav-section {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		justify-content: space-between;
		align-items: center;
	}

	.nav-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #7c3aed, #6d28d9);
		color: white;
		text-decoration: none;
		font-size: 0.875rem;
		font-weight: 600;
		border-radius: 12px;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(124,58,237,0.3);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.nav-link:hover {
		background: linear-gradient(135deg, #6d28d9, #5b21b6);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(124,58,237,0.4);
	}

	/* User Info */
	.user-info {
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.status-text, .function-text {
		margin: 0.25rem 0;
		font-size: 0.95rem;
		color: #374151;
	}

	.highlight {
		color: #7c3aed;
		font-weight: 600;
	}

	/* Message */
	.message {
		background: white;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
		border-left: 4px solid #6b7280;
	}

	.message.success {
		background: #f0fdf4;
		border-left-color: #16a34a;
		color: #15803d;
	}

	.message.error {
		background: #fef2f2;
		border-left-color: #dc2626;
		color: #dc2626;
	}

	/* Loading and Empty States */
	.loading-state, .empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #e5e7eb;
		border-top: 4px solid #7c3aed;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.empty-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.empty-action {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #7c3aed;
		color: white;
		text-decoration: none;
		border-radius: 8px;
		margin-top: 1rem;
		transition: background-color 0.2s ease;
	}

	.empty-action:hover {
		background: #6d28d9;
	}

	/* Details Section */
	.details-section {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.1);
		border: 1px solid #e5e7eb;
		margin-bottom: 2rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.section-header h3 {
		margin: 0;
		font-size: 1.5rem;
		color: #1f2937;
		font-weight: 600;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
	}

	.table-container {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		overflow: hidden;
	}

	/* Edit Form Styles */
	.edit-input, .edit-select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.edit-input:focus, .edit-select:focus {
		outline: none;
		border-color: #7c3aed;
		box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
	}

	.edit-input.error {
		border-color: #dc2626;
	}

	.error-text {
		color: #dc2626;
		font-size: 0.75rem;
		margin-top: 0.25rem;
	}

	/* Display Styles */
	.role-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.account-number, .vendor-code {
		color: #6b7280;
		font-size: 0.875rem;
		font-family: monospace;
		margin-left: 0.5rem;
	}

	.access-notice {
		background: #f8fafc;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
		color: #6b7280;
		font-style: italic;
		margin-top: 2rem;
	}

	/* Global Button Styles */
	:global(.save-btn) {
		background: #16a34a;
		color: white;
	}

	:global(.save-btn:hover) {
		background: #15803d;
	}

	:global(.edit-btn) {
		background: #7c3aed;
		color: white;
	}

	:global(.edit-btn:hover) {
		background: #6d28d9;
	}

	/* Logout Section */
	.logout-section {
		text-align: center;
		margin-top: 2rem;
	}

	.logout-button {
		padding: 0.75rem 1.5rem;
		background: linear-gradient(135deg, #dc2626, #b91c1c);
		color: white;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		box-shadow: 0 4px 15px rgba(220,38,38,0.3);
	}

	.logout-button:hover:not(:disabled) {
		background: linear-gradient(135deg, #b91c1c, #991b1b);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(220,38,38,0.4);
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.user-container {
			padding: 1rem;
		}

		.section-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.header-actions {
			justify-content: center;
		}

		.nav-section {
			flex-direction: column;
			gap: 0.75rem;
		}
	}
</style>
