<!-- Users Management - Management -->
<script lang="ts">
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { getCurrentUser, signOut } from '$lib/auth'
	import { getCurrentUserProfile } from '$lib/userService'
	import type { User } from '@supabase/supabase-js'
	import type { UserProfile } from '$lib/types'
	
	let user: User | null = null
	let userProfile: UserProfile | null = null
	let loading = false

	// Search and filter parameters
	let filters = {
		search: '',
		role: '',
		status: ''
	}

	// Mock user data
	let users = [
		{
			id: 1,
			email: 'john.manager@quicktrack.com',
			full_name: 'John Manager',
			role: 'Management',
			status: 'active',
			last_login: '2024-01-15 09:30:00',
			created_at: '2023-12-01',
			jobs_assigned: 45
		},
		{
			id: 2,
			email: 'sarah.ops@quicktrack.com',
			full_name: 'Sarah Operations',
			role: 'Operations',
			status: 'active',
			last_login: '2024-01-15 11:45:00',
			created_at: '2023-11-15',
			jobs_assigned: 127
		},
		{
			id: 3,
			email: 'mike.lsp@logistics.com',
			full_name: 'Mike LSP Partner',
			role: 'LSP',
			status: 'active',
			last_login: '2024-01-14 16:20:00',
			created_at: '2024-01-01',
			jobs_assigned: 23
		},
		{
			id: 4,
			email: 'demo.customer@acme.com',
			full_name: 'Demo Customer',
			role: 'Customer',
			status: 'pending',
			last_login: null,
			created_at: '2024-01-15',
			jobs_assigned: 0
		},
		{
			id: 5,
			email: 'admin@quicktrack.com',
			full_name: 'System Administrator',
			role: 'Admin',
			status: 'active',
			last_login: '2024-01-15 12:00:00',
			created_at: '2023-10-01',
			jobs_assigned: 203
		}
	]

	let filteredUsers = users
	let showUserModal = false
	let selectedUser: any = null

	onMount(async () => {
		user = await getCurrentUser()
		if (user) {
			try {
				userProfile = await getCurrentUserProfile()
			} catch (error) {
				console.error('Error loading user profile:', error)
			}
		}
		applyFilters()
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

	function applyFilters() {
		filteredUsers = users.filter(u => {
			const matchesSearch = !filters.search || 
				u.email.toLowerCase().includes(filters.search.toLowerCase()) ||
				u.full_name.toLowerCase().includes(filters.search.toLowerCase())
			const matchesRole = !filters.role || u.role === filters.role
			const matchesStatus = !filters.status || u.status === filters.status
			
			return matchesSearch && matchesRole && matchesStatus
		})
	}

	function clearFilters() {
		filters = { search: '', role: '', status: '' }
		applyFilters()
	}

	function viewUser(userId: number) {
		selectedUser = users.find(u => u.id === userId)
		showUserModal = true
	}

	function editUser(userId: number) {
		// TODO: Implement user editing
		alert(`Edit user functionality will be implemented for user ID: ${userId}`)
	}

	function toggleUserStatus(userId: number) {
		const userIndex = users.findIndex(u => u.id === userId)
		if (userIndex !== -1) {
			users[userIndex].status = users[userIndex].status === 'active' ? 'inactive' : 'active'
			applyFilters()
		}
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return 'Never'
		return new Date(dateString).toLocaleDateString()
	}

	function getRoleColor(role: string): string {
		switch (role) {
			case 'Admin': return 'red'
			case 'Management': return 'purple'
			case 'Operations': return 'orange'
			case 'LSP': return 'blue'
			case 'Customer': return 'green'
			default: return 'gray'
		}
	}
</script>

<div class="terminal-container">
	<div class="main-content">
		<!-- ASCII Art Header -->
		<div class="ascii-header">
			<pre class="red-text">QQQQQQ                               
QQ    QQ          ii        k      k       
QQ    QQ uu   uu iii   cccc kk   kk
QQ    QQ uu   uu  ii  cc    kk kk
QQ QQ QQ uu   uu  ii  cc    kkk
QQQQ  QQ uu   uu  ii  cc    kk kk
  QQQQQQ    uuuu  iiii  cccc kk   kk
QQ</pre>
		</div>

		<!-- System Title -->
		<div class="system-title">
			<span class="red-text">MANAGEMENT PORTAL - USER MANAGEMENT</span>
		</div>

		<!-- Navigation -->
		<div class="nav-section">
			<a href="/dashboard/management" class="nav-link">⬅ BACK TO MANAGEMENT MENU</a>
		</div>

		<!-- User Information -->
		{#if user && userProfile}
			<div class="user-info">
				<p class="blue-text">Status: <span class="purple-text">MANAGEMENT ACCESS</span></p>
				<p class="blue-text">Function: USER ADMINISTRATION</p>
			</div>
		{/if}

		<!-- Search and Filters -->
		<div class="filters-section">
			<h3 class="blue-text">--- USER SEARCH & FILTERS ---</h3>
			<div class="filters-form">
				<div class="filter-row">
					<div class="form-group">
						<label class="blue-text">SEARCH USERS:</label>
						<input type="text" bind:value={filters.search} on:input={applyFilters} class="form-input" placeholder="Email or name..." />
					</div>
					<div class="form-group">
						<label class="blue-text">ROLE:</label>
						<select bind:value={filters.role} on:change={applyFilters} class="form-input">
							<option value="">ALL ROLES</option>
							<option value="Admin">ADMIN</option>
							<option value="Management">MANAGEMENT</option>
							<option value="Operations">OPERATIONS</option>
							<option value="LSP">LSP</option>
							<option value="Customer">CUSTOMER</option>
						</select>
					</div>
					<div class="form-group">
						<label class="blue-text">STATUS:</label>
						<select bind:value={filters.status} on:change={applyFilters} class="form-input">
							<option value="">ALL STATUSES</option>
							<option value="active">ACTIVE</option>
							<option value="inactive">INACTIVE</option>
							<option value="pending">PENDING</option>
						</select>
					</div>
					<div class="form-group">
						<button on:click={clearFilters} class="clear-button">CLEAR</button>
					</div>
				</div>
			</div>
		</div>

		<!-- User Statistics -->
		<div class="stats-section">
			<h3 class="blue-text">--- USER STATISTICS ---</h3>
			<div class="stats-grid">
				<div class="stat-card">
					<div class="stat-title">TOTAL USERS</div>
					<div class="stat-value">{users.length}</div>
				</div>
				<div class="stat-card">
					<div class="stat-title">ACTIVE USERS</div>
					<div class="stat-value">{users.filter(u => u.status === 'active').length}</div>
				</div>
				<div class="stat-card">
					<div class="stat-title">PENDING USERS</div>
					<div class="stat-value">{users.filter(u => u.status === 'pending').length}</div>
				</div>
				<div class="stat-card">
					<div class="stat-title">FILTERED RESULTS</div>
					<div class="stat-value">{filteredUsers.length}</div>
				</div>
			</div>
		</div>

		<!-- Users Table -->
		<div class="results-section">
			<h3 class="blue-text">--- USER DIRECTORY ---</h3>
			<div class="results-table">
				<div class="table-header">
					<div class="col">NAME</div>
					<div class="col">EMAIL</div>
					<div class="col">ROLE</div>
					<div class="col">STATUS</div>
					<div class="col">LAST LOGIN</div>
					<div class="col">JOBS</div>
					<div class="col">ACTIONS</div>
				</div>
				{#each filteredUsers as user}
					<div class="table-row">
						<div class="col user-name">{user.full_name}</div>
						<div class="col">{user.email}</div>
						<div class="col role" style="color: {getRoleColor(user.role)}">{user.role}</div>
						<div class="col status status-{user.status}">{user.status.toUpperCase()}</div>
						<div class="col">{formatDate(user.last_login)}</div>
						<div class="col">{user.jobs_assigned}</div>
						<div class="col">
							<button class="action-button" on:click={() => viewUser(user.id)}>VIEW</button>
							<button class="action-button" on:click={() => editUser(user.id)}>EDIT</button>
							<button class="action-button toggle" on:click={() => toggleUserStatus(user.id)}>
								{user.status === 'active' ? 'DISABLE' : 'ENABLE'}
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Command Prompt -->
		<div class="command-prompt">
			<span class="red-text">([MGMT] User Management Module - {filteredUsers.length} Users Displayed)</span>
		</div>

		<!-- Logout Button -->
		<div class="logout-section">
			<button on:click={handleSignOut} disabled={loading} class="logout-button">
				{loading ? 'SIGNING OUT...' : 'LOGOUT'}
			</button>
		</div>
	</div>
</div>

<!-- User Detail Modal -->
{#if showUserModal && selectedUser}
	<div class="modal-overlay" on:click={() => showUserModal = false}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<h3 class="blue-text">--- USER DETAILS ---</h3>
				<button class="close-button" on:click={() => showUserModal = false}>✕</button>
			</div>
			<div class="modal-body">
				<div class="detail-row">
					<span class="detail-label">NAME:</span>
					<span class="detail-value">{selectedUser.full_name}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">EMAIL:</span>
					<span class="detail-value">{selectedUser.email}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">ROLE:</span>
					<span class="detail-value" style="color: {getRoleColor(selectedUser.role)}">{selectedUser.role}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">STATUS:</span>
					<span class="detail-value status-{selectedUser.status}">{selectedUser.status.toUpperCase()}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">CREATED:</span>
					<span class="detail-value">{formatDate(selectedUser.created_at)}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">LAST LOGIN:</span>
					<span class="detail-value">{formatDate(selectedUser.last_login)}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">JOBS ASSIGNED:</span>
					<span class="detail-value">{selectedUser.jobs_assigned}</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.terminal-container {
		background-color: white;
		font-family: 'Courier New', monospace;
		font-size: 14px;
		line-height: 1.2;
		padding: 20px;
		min-height: 100vh;
		box-sizing: border-box;
	}

	.main-content {
		max-width: 1400px;
		margin: 0 auto;
	}

	.ascii-header {
		margin-bottom: 20px;
	}

	.ascii-header pre {
		margin: 0;
		font-size: 12px;
		line-height: 1;
	}

	.red-text {
		color: red;
		font-weight: bold;
	}

	.blue-text {
		color: blue;
		font-weight: bold;
	}

	.purple-text {
		color: purple;
		font-weight: bold;
	}

	.system-title {
		margin: 20px 0;
		text-align: left;
	}

	.nav-section {
		margin: 20px 0;
	}

	.nav-link {
		display: inline-block;
		padding: 6px 12px;
		background-color: #8800cc;
		color: white;
		text-decoration: none;
		font-size: 10px;
		font-weight: bold;
		border: 1px solid #6600aa;
	}

	.nav-link:hover {
		background-color: #6600aa;
	}

	.user-info {
		margin: 20px 0;
	}

	.user-info p {
		margin: 5px 0;
	}

	.filters-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #8800cc;
		background-color: #f8f0ff;
	}

	.filters-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.filter-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 100px;
		gap: 15px;
		align-items: end;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}

	.form-group label {
		font-size: 12px;
	}

	.form-input {
		padding: 8px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		border: 1px solid #ccc;
		background-color: white;
	}

	.clear-button {
		padding: 8px 15px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #888888;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}

	.clear-button:hover {
		background-color: #666666;
	}

	.stats-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #0066cc;
		background-color: #f8f9fa;
	}

	.stats-section h3 {
		margin: 0 0 15px 0;
		text-align: center;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 15px;
	}

	.stat-card {
		background-color: white;
		border: 1px solid #ddd;
		padding: 15px;
		text-align: center;
	}

	.stat-title {
		font-size: 10px;
		color: blue;
		font-weight: bold;
		margin-bottom: 8px;
	}

	.stat-value {
		font-size: 20px;
		font-weight: bold;
		color: purple;
	}

	.results-section {
		margin: 30px 0;
		padding: 20px;
		border: 2px solid #ff8800;
		background-color: #fff8f0;
	}

	.results-section h3 {
		margin: 0 0 20px 0;
		text-align: center;
	}

	.results-table {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.table-header {
		display: grid;
		grid-template-columns: 150px 200px 100px 80px 120px 60px 180px;
		background-color: #8800cc;
		color: white;
		font-weight: bold;
		font-size: 10px;
	}

	.table-row {
		display: grid;
		grid-template-columns: 150px 200px 100px 80px 120px 60px 180px;
		background-color: white;
		border: 1px solid #ddd;
		font-size: 10px;
	}

	.table-row:hover {
		background-color: #f0f0f0;
	}

	.col {
		padding: 8px;
		border-right: 1px solid #ddd;
	}

	.col:last-child {
		border-right: none;
	}

	.user-name {
		font-weight: bold;
		color: purple;
	}

	.role {
		font-weight: bold;
	}

	.status-active {
		color: green;
		font-weight: bold;
	}

	.status-inactive {
		color: red;
		font-weight: bold;
	}

	.status-pending {
		color: orange;
		font-weight: bold;
	}

	.action-button {
		padding: 4px 6px;
		font-family: 'Courier New', monospace;
		font-size: 8px;
		background-color: #0066cc;
		color: white;
		border: none;
		cursor: pointer;
		margin-right: 3px;
	}

	.action-button:hover {
		background-color: #004499;
	}

	.action-button.toggle {
		background-color: #ff8800;
	}

	.action-button.toggle:hover {
		background-color: #cc6600;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.7);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background-color: white;
		border: 2px solid #8800cc;
		padding: 20px;
		max-width: 500px;
		width: 90%;
		font-family: 'Courier New', monospace;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.close-button {
		background-color: #cc0000;
		color: white;
		border: none;
		padding: 5px 10px;
		cursor: pointer;
		font-family: 'Courier New', monospace;
		font-weight: bold;
	}

	.close-button:hover {
		background-color: #990000;
	}

	.detail-row {
		display: flex;
		margin-bottom: 10px;
	}

	.detail-label {
		font-weight: bold;
		color: blue;
		width: 120px;
		font-size: 12px;
	}

	.detail-value {
		color: black;
		font-size: 12px;
	}

	.command-prompt {
		margin-top: 30px;
		background-color: red;
		color: white;
		padding: 5px 10px;
		font-weight: bold;
	}

	.logout-section {
		margin-top: 20px;
		text-align: center;
	}

	.logout-button {
		padding: 10px 20px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		background-color: #cc0000;
		color: white;
		border: none;
		cursor: pointer;
		font-weight: bold;
	}

	.logout-button:hover {
		background-color: #990000;
	}

	.logout-button:disabled {
		background-color: #cccccc;
		cursor: not-allowed;
	}
</style> 