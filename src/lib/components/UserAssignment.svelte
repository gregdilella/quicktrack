<script lang="ts">
	import { onMount } from 'svelte'
	import { getAllUserProfiles, updateUserRole } from '$lib/userService'
	import type { UserProfile, UserRole } from '$lib/types'

	let users: UserProfile[] = []
	let loading = true
	let updating = false
	let message = ''
	let messageType: 'success' | 'error' | '' = ''

	const roleOptions: UserRole[] = ['Not-Assigned', 'Customer', 'LSP', 'Operations', 'Management', 'Admin']

	onMount(async () => {
		await loadUsers()
	})

	async function loadUsers() {
		loading = true
		try {
			users = await getAllUserProfiles()
			console.log('Loaded users:', users)
		} catch (error) {
			console.error('Error loading users:', error)
			showMessage('Error loading users', 'error')
		} finally {
			loading = false
		}
	}

	async function handleRoleChange(userId: string, newRole: UserRole) {
		updating = true
		try {
			const success = await updateUserRole(userId, newRole)
			if (success) {
				// Update the local user list
				users = users.map(user => 
					user.user_id === userId ? { ...user, role: newRole } : user
				)
				showMessage(`Role updated successfully`, 'success')
			} else {
				showMessage('Failed to update role', 'error')
			}
		} catch (error) {
			console.error('Error updating role:', error)
			showMessage('Error updating role', 'error')
		} finally {
			updating = false
		}
	}

	function showMessage(text: string, type: 'success' | 'error') {
		message = text
		messageType = type
		setTimeout(() => {
			message = ''
			messageType = ''
		}, 3000)
	}

	function getRoleDisplayName(role: UserRole | null): string {
		return role || 'Not-Assigned'
	}

	function getRoleColor(role: UserRole | null): string {
		switch (role) {
			case 'Admin': return 'red'
			case 'Management': return 'purple'
			case 'Operations': return 'blue'
			case 'LSP': return 'green'
			case 'Customer': return 'orange'
			case 'Not-Assigned': return 'gray'
			default: return 'gray'
		}
	}
</script>

<div class="user-assignment-section">
	<h3 class="blue-text">--- USER ROLE ASSIGNMENT ---</h3>
	
	{#if message}
		<div class="message" class:success={messageType === 'success'} class:error={messageType === 'error'}>
			{message}
		</div>
	{/if}

	{#if loading}
		<div class="loading">
			<p class="blue-text">LOADING USER DATABASE...</p>
		</div>
	{:else if users.length === 0}
		<div class="no-users">
			<p class="blue-text">NO USERS FOUND IN DATABASE</p>
		</div>
	{:else}
		<div class="users-grid">
			{#each users as user (user.user_id)}
				<div class="user-card">
					<div class="user-info">
						<div class="user-email">{user.email.toUpperCase()}</div>
						<div class="user-role" style="color: {getRoleColor(user.role)}">
							{getRoleDisplayName(user.role)}
						</div>
						<div class="user-id">ID: {user.user_id.substring(0, 8)}...</div>
					</div>
					
					<div class="role-selector">
						<label class="blue-text">ASSIGN ROLE:</label>
						<select 
							value={user.role || 'Not-Assigned'} 
							on:change={(e) => handleRoleChange(user.user_id, (e.target as HTMLSelectElement).value as UserRole)}
							disabled={updating}
							class="role-select"
						>
							{#each roleOptions as role}
								<option value={role}>{role}</option>
							{/each}
						</select>
					</div>
				</div>
			{/each}
		</div>

		<div class="refresh-section">
			<button class="refresh-button" on:click={loadUsers} disabled={loading || updating}>
				{loading ? 'LOADING...' : 'REFRESH USER LIST'}
			</button>
		</div>
	{/if}
</div>

<style>
	.user-assignment-section {
		margin: 30px 0;
		padding: 15px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.user-assignment-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.blue-text {
		color: blue;
		font-weight: bold;
	}

	.message {
		padding: 8px 12px;
		margin-bottom: 15px;
		border: 1px solid;
		font-weight: bold;
		text-align: center;
	}

	.message.success {
		background-color: #d4edda;
		border-color: #28a745;
		color: #155724;
	}

	.message.error {
		background-color: #f8d7da;
		border-color: #dc3545;
		color: #721c24;
	}

	.loading, .no-users {
		text-align: center;
		padding: 20px;
	}

	.users-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 15px;
		margin-bottom: 20px;
	}

	.user-card {
		background-color: white;
		border: 1px solid #ddd;
		padding: 15px;
		font-family: 'Courier New', monospace;
	}

	.user-info {
		margin-bottom: 15px;
	}

	.user-email {
		font-weight: bold;
		color: purple;
		margin-bottom: 5px;
		font-size: 12px;
	}

	.user-role {
		font-weight: bold;
		margin-bottom: 5px;
		font-size: 11px;
	}

	.user-id {
		font-size: 10px;
		color: #666;
	}

	.role-selector {
		border-top: 1px solid #eee;
		padding-top: 10px;
	}

	.role-selector label {
		display: block;
		margin-bottom: 5px;
		font-size: 10px;
	}

	.role-select {
		width: 100%;
		padding: 5px;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		border: 1px solid #ccc;
		background-color: white;
	}

	.role-select:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}

	.refresh-section {
		text-align: center;
		border-top: 1px solid #ddd;
		padding-top: 15px;
	}

	.refresh-button {
		padding: 8px 16px;
		font-family: 'Courier New', monospace;
		font-size: 11px;
		background-color: #0066cc;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}

	.refresh-button:hover:not(:disabled) {
		background-color: #0052a3;
	}

	.refresh-button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}
</style> 