<!--
  AddressMap Component
  
  This component displays a Google Map for a validated address.
  It shows both an interactive embed map and address validation information.
  It can also show the route to the nearest airport.
-->

<script lang="ts">
	import { getMapEmbedUrl, getMapEmbedUrlWithDirections, getMapDirectionsUrlFallback, getStaticMapUrl, findNearestAirportWithRoute, type ValidatedAddress, type AirportRouteInfo } from '$lib/services/googleMapsService';
	
	// Component props
	export let validatedAddress: ValidatedAddress | null = null;
	export let title: string = 'Address Location';
	export let height: string = '300px';
	export let showDetails: boolean = true;
	export let showAirportRoute: boolean = false;
	
	// Internal state
	let mapLoaded = false;
	let mapError = false;
	let loadingAirportRoute = false;
	let loadingMapUrl = false;
	let airportRouteInfo: AirportRouteInfo | null = null;
	let airportRouteError = '';
	let embedUrl = '';
	
	// Reactive values
	$: staticMapUrl = validatedAddress ? getStaticMapUrl(validatedAddress.latitude, validatedAddress.longitude, 400, 300) : '';
	
	// Generate embed URL asynchronously
	async function generateEmbedUrl(address: ValidatedAddress | null, routeInfo: AirportRouteInfo | null, showRoute: boolean): Promise<void> {
		if (!address) {
			embedUrl = '';
			return;
		}
		
		loadingMapUrl = true;
		
		try {
			// If we have airport route info and showAirportRoute is true, show directions
			if (showRoute && routeInfo) {
				console.log(`[AddressMap] Generating directions embed URL`);
				const directionsUrl = await getMapEmbedUrlWithDirections(
					address.latitude,
					address.longitude,
					routeInfo.airport.latitude,
					routeInfo.airport.longitude
				);
				console.log(`[AddressMap] Switching to directions view:`, directionsUrl);
				embedUrl = directionsUrl;
			} else {
				// Otherwise show just the location
				console.log(`[AddressMap] Generating location embed URL`);
				const locationUrl = await getMapEmbedUrl(address.latitude, address.longitude);
				console.log(`[AddressMap] Showing location view:`, locationUrl);
				embedUrl = locationUrl;
			}
		} catch (error) {
			console.error('[AddressMap] Error generating embed URL:', error);
			embedUrl = '';
		} finally {
			loadingMapUrl = false;
		}
	}
	
	// Watch for changes and regenerate embed URL
	$: if (validatedAddress || airportRouteInfo !== null) {
		generateEmbedUrl(validatedAddress, airportRouteInfo, showAirportRoute);
	}
	
	function handleMapLoad() {
		mapLoaded = true;
		mapError = false;
	}
	
	function handleMapError(event: any) {
		console.error('[AddressMap] Map failed to load:', event);
		console.log('[AddressMap] Current embed URL:', embedUrl);
		mapError = true;
		mapLoaded = false;
	}
	
	function getConfidenceColor(confidence: ValidatedAddress['confidence']): string {
		switch (confidence) {
			case 'high': return '#059669'; // green
			case 'medium': return '#d97706'; // orange
			case 'low': return '#dc2626'; // red
			default: return '#6b7280'; // gray
		}
	}
	
	function getConfidenceText(confidence: ValidatedAddress['confidence']): string {
		switch (confidence) {
			case 'high': return 'High accuracy - exact address match';
			case 'medium': return 'Medium accuracy - approximate location';
			case 'low': return 'Low accuracy - general area only';
			default: return 'Unknown accuracy';
		}
	}
	
	async function loadAirportRoute() {
		if (!validatedAddress || !showAirportRoute) return;
		
		console.log(`[AddressMap] Loading airport route for ${validatedAddress.formatted} at ${validatedAddress.latitude}, ${validatedAddress.longitude}`);
		
		loadingAirportRoute = true;
		airportRouteError = '';
		airportRouteInfo = null;
		
		try {
			const route = await findNearestAirportWithRoute(
				validatedAddress.latitude,
				validatedAddress.longitude
			);
			
			if (route) {
				console.log(`[AddressMap] Found airport route:`, route);
				airportRouteInfo = route;
			} else {
				console.warn(`[AddressMap] No airport route found for ${validatedAddress.formatted}`);
				airportRouteError = 'No nearby airports found or route calculation failed. Try expanding the search radius or check if there are airports in your area.';
			}
		} catch (error) {
			console.error('[AddressMap] Error loading airport route:', error);
			airportRouteError = `Failed to calculate route to nearest airport: ${error instanceof Error ? error.message : 'Unknown error'}`;
		} finally {
			loadingAirportRoute = false;
		}
	}
	
	// Load airport route when address changes and showAirportRoute is true
	$: if (validatedAddress && showAirportRoute) {
		loadAirportRoute();
	}
	
	// Formatting functions
	function formatDuration(minutes: number): string {
		if (minutes < 60) {
			return `${Math.round(minutes)} min`;
		}
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = Math.round(minutes % 60);
		if (remainingMinutes === 0) {
			return `${hours} hr`;
		}
		return `${hours} hr ${remainingMinutes} min`;
	}
	
	function formatDistance(distance: number, unit?: string): string {
		if (!unit) unit = 'mi'; // default to miles for backward compatibility
		
		if (unit === 'km') {
			if (distance < 1) {
				return `${(distance * 1000).toFixed(0)} m`;
			}
			return `${distance.toFixed(1)} km`;
		} else {
			// miles
			if (distance < 1) {
				return `${(distance * 5280).toFixed(0)} ft`;
			}
			return `${distance.toFixed(1)} mi`;
		}
	}
	
	function formatTollAmount(amount: number, currency: string = 'USD'): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency
		}).format(amount);
	}
</script>

{#if validatedAddress}
	<div class="address-map-container">
		<!-- Address Information Header -->
		<div class="address-header">
			<h3 class="address-title">{title}</h3>
			<div class="address-info">
				<div class="formatted-address">
					<strong>{validatedAddress.formatted}</strong>
				</div>
				<div class="confidence-indicator" style="color: {getConfidenceColor(validatedAddress.confidence)}">
					<svg class="confidence-icon" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
					</svg>
					{getConfidenceText(validatedAddress.confidence)}
				</div>
				
				<!-- Map Mode Indicator -->
				{#if showAirportRoute}
					<div class="map-mode-indicator">
						{#if loadingAirportRoute}
							<svg class="indicator-icon loading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
							<span>Finding nearest airport...</span>
						{:else if airportRouteInfo}
							<svg class="indicator-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
							</svg>
							<span>Map showing directions to airport</span>
						{:else}
							<svg class="indicator-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
							</svg>
							<span>Map showing address location</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Map Display -->
		<div class="map-container" style="height: {height}">
			{#if loadingMapUrl}
				<div class="map-loading">
					<div class="loading-spinner"></div>
					<p>Generating map...</p>
				</div>
			{:else if !mapError && embedUrl}
				{#key embedUrl}
					<iframe
						src={embedUrl}
						width="100%"
						height="100%"
						style="border: 0; border-radius: 8px;"
						allowfullscreen={true}
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
						title="{title} Map"
						on:load={handleMapLoad}
						on:error={handleMapError}
					></iframe>
				{/key}
			{:else}
				<!-- Fallback to static map image or directions link -->
				<div class="static-map-fallback">
					{#if showAirportRoute && airportRouteInfo}
						<!-- Show directions link when map fails and we have airport route -->
						<div class="directions-fallback">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
							</svg>
							<h4>Map unavailable - View directions instead</h4>
							<p>Route to {airportRouteInfo.airport.name}</p>
							<a 
								href={getMapDirectionsUrlFallback(
									validatedAddress.latitude,
									validatedAddress.longitude,
									airportRouteInfo.airport.latitude,
									airportRouteInfo.airport.longitude
								)}
								target="_blank"
								rel="noopener noreferrer"
								class="directions-link"
							>
								Open in Google Maps
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
								</svg>
							</a>
						</div>
					{:else}
						<!-- Regular static map fallback -->
						<img 
							src={staticMapUrl} 
							alt="{title} Map"
							class="static-map-image"
							on:error={() => console.warn('Static map also failed to load')}
						/>
						<div class="fallback-notice">
							Interactive map unavailable. Showing static view.
						</div>
					{/if}
				</div>
			{/if}
			
			{#if !mapLoaded && !mapError && !loadingMapUrl && embedUrl}
				<div class="map-loading">
					<div class="loading-spinner"></div>
					<p>Loading map...</p>
				</div>
			{/if}
		</div>
		
		<!-- Address Details (Optional) -->
		{#if showDetails}
			<div class="address-details">
				<div class="details-grid">
					{#if validatedAddress.components.street_number || validatedAddress.components.route}
						<div class="detail-item">
							<span class="detail-label">Street:</span>
							<span class="detail-value">
								{validatedAddress.components.street_number || ''} {validatedAddress.components.route || ''}
							</span>
						</div>
					{/if}
					
					{#if validatedAddress.components.locality}
						<div class="detail-item">
							<span class="detail-label">City:</span>
							<span class="detail-value">{validatedAddress.components.locality}</span>
						</div>
					{/if}
					
					{#if validatedAddress.components.administrative_area_level_1}
						<div class="detail-item">
							<span class="detail-label">State:</span>
							<span class="detail-value">{validatedAddress.components.administrative_area_level_1}</span>
						</div>
					{/if}
					
					{#if validatedAddress.components.postal_code}
						<div class="detail-item">
							<span class="detail-label">ZIP:</span>
							<span class="detail-value">{validatedAddress.components.postal_code}</span>
						</div>
					{/if}
					
					<div class="detail-item">
						<span class="detail-label">Coordinates:</span>
						<span class="detail-value coordinates">
							{validatedAddress.latitude.toFixed(6)}, {validatedAddress.longitude.toFixed(6)}
						</span>
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Airport Route Information -->
		{#if showAirportRoute}
			{#if loadingAirportRoute}
				<div class="airport-loading">
					<div class="loading-spinner"></div>
					<p>Finding nearest airport and calculating route...</p>
				</div>
			{:else if airportRouteError}
				<div class="airport-error">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					<p>{airportRouteError}</p>
					<button 
						class="retry-airport-btn"
						on:click={() => loadAirportRoute()}
						disabled={loadingAirportRoute}
					>
						Try Again
					</button>
				</div>
			{:else if airportRouteInfo}
				<div class="airport-route-info">
					<div class="airport-header">
						<div class="airport-icon">
							<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
							</svg>
						</div>
						<div class="airport-details">
							<h4>Nearest Airport: {airportRouteInfo.airport.name}</h4>
							{#if airportRouteInfo.airport.iata_code}
								<span class="airport-code">({airportRouteInfo.airport.iata_code})</span>
							{/if}
							<p class="airport-address">{airportRouteInfo.airport.formatted_address}</p>
						</div>
					</div>
					
					<div class="route-stats">
						<div class="stat">
							<div class="stat-icon">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
								</svg>
							</div>
							<div class="stat-content">
								<span class="stat-value">{formatDuration(airportRouteInfo.duration_minutes)}</span>
								<span class="stat-label">Drive Time</span>
							</div>
						</div>
						
						<div class="stat">
							<div class="stat-icon">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
								</svg>
							</div>
							<div class="stat-content">
								<span class="stat-value">{formatDistance(airportRouteInfo.distance_miles, airportRouteInfo.distance_unit)}</span>
								<span class="stat-label">Distance</span>
							</div>
						</div>
						
						<div class="stat">
							<div class="stat-icon">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
								</svg>
							</div>
							<div class="stat-content">
								{#if airportRouteInfo.has_tolls && airportRouteInfo.toll_info}
									<span class="stat-value toll-amount">{formatTollAmount(airportRouteInfo.toll_info.estimated_price, airportRouteInfo.toll_info.currency)}</span>
									<span class="stat-label">Estimated Tolls</span>
								{:else}
									<span class="stat-value no-tolls">No Tolls</span>
									<span class="stat-label">Toll-Free Route</span>
								{/if}
							</div>
						</div>
					</div>
					
					<div class="route-notice">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
						<span>Map above shows driving directions to the nearest airport</span>
					</div>
				</div>
			{/if}
		{/if}
	</div>
{/if}

<style>
	.address-map-container {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.05);
		overflow: hidden;
		margin-top: 1rem;
	}
	
	.address-header {
		padding: 1.5rem;
		border-bottom: 1px solid #f3f4f6;
		background: #fafbfc;
	}
	
	.address-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: #1f2937;
		margin: 0 0 0.75rem 0;
	}
	
	.address-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.formatted-address {
		font-size: 0.95rem;
		color: #4b5563;
		line-height: 1.4;
	}
	
	.confidence-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
	}
	
	.confidence-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}
	
	.map-mode-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: #3b82f6;
		font-weight: 500;
		margin-top: 0.5rem;
	}
	
	.indicator-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}
	
	.indicator-icon.loading {
		animation: spin 1s linear infinite;
	}
	
	.map-container {
		position: relative;
		background: #f9fafb;
	}
	
	.map-loading {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(249, 250, 251, 0.9);
		z-index: 10;
	}
	
	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #34547a;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 0.5rem;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.static-map-fallback {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f3f4f6;
	}
	
	.static-map-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 8px;
	}
	
	.fallback-notice {
		position: absolute;
		bottom: 8px;
		left: 8px;
		right: 8px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		font-size: 0.75rem;
		padding: 0.5rem;
		border-radius: 4px;
		text-align: center;
	}
	
	.directions-fallback {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 2rem;
		text-align: center;
		color: #6b7280;
	}
	
	.directions-fallback svg:first-child {
		width: 48px;
		height: 48px;
		margin-bottom: 1rem;
		color: #9ca3af;
	}
	
	.directions-fallback h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #374151;
	}
	
	.directions-fallback p {
		margin: 0 0 1.5rem 0;
		color: #6b7280;
	}
	
	.directions-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #3b82f6;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		transition: background-color 0.2s;
	}
	
	.directions-link:hover {
		background: #2563eb;
	}
	
	.directions-link svg {
		width: 16px;
		height: 16px;
	}
	
	.address-details {
		padding: 1.5rem;
		background: white;
	}
	
	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}
	
	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	.detail-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.detail-value {
		font-size: 0.875rem;
		color: #1f2937;
		font-weight: 500;
	}
	
	.detail-value.coordinates {
		font-family: 'Courier New', monospace;
		font-size: 0.8rem;
		color: #6b7280;
	}
	
	.airport-loading,
	.airport-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: #fafbfc;
		border-top: 1px solid #f3f4f6;
	}
	
	.airport-loading .loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 0.75rem;
	}
	
	.airport-loading p {
		color: #6b7280;
		font-size: 0.875rem;
		margin: 0;
		text-align: center;
	}
	
	.airport-error {
		color: #dc2626;
	}
	
	.airport-error svg {
		width: 32px;
		height: 32px;
		margin-bottom: 0.5rem;
	}
	
	.airport-error p {
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
		text-align: center;
	}
	
	.retry-airport-btn {
		background: #dc2626;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}
	
	.retry-airport-btn:hover:not(:disabled) {
		background: #b91c1c;
	}
	
	.retry-airport-btn:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}
	
	.airport-route-info {
		padding: 1.5rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-top: 1px solid #f3f4f6;
	}
	
	.airport-header {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.airport-icon {
		width: 48px;
		height: 48px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.airport-icon svg {
		width: 24px;
		height: 24px;
	}
	
	.airport-details h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
		font-weight: 600;
	}
	
	.airport-code {
		background: rgba(255, 255, 255, 0.2);
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 600;
		margin-left: 0.5rem;
	}
	
	.airport-address {
		margin: 0.5rem 0 0 0;
		font-size: 0.9rem;
		opacity: 0.9;
	}
	
	.route-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	
	.stat {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		padding: 1rem;
		border-radius: 8px;
	}
	
	.stat-icon {
		width: 32px;
		height: 32px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	
	.stat-icon svg {
		width: 18px;
		height: 18px;
	}
	
	.stat-content {
		display: flex;
		flex-direction: column;
	}
	
	.stat-value {
		font-size: 1.125rem;
		font-weight: 700;
		line-height: 1.2;
	}
	
	.stat-value.toll-amount {
		color: #fef3c7;
	}
	
	.stat-value.no-tolls {
		color: #bbf7d0;
	}
	
	.stat-label {
		font-size: 0.75rem;
		opacity: 0.8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 500;
	}
	
	.route-notice {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.75rem 1rem;
		border-radius: 6px;
		font-size: 0.875rem;
		opacity: 0.9;
	}
	
	.route-notice svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}
	
	/* Responsive Design */
	@media (max-width: 768px) {
		.address-header {
			padding: 1rem;
		}
		
		.address-details {
			padding: 1rem;
		}
		
		.details-grid {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}
		
		.address-info {
			gap: 0.75rem;
		}
		
		.confidence-indicator {
			font-size: 0.8rem;
		}
		
		.airport-route-info {
			padding: 1rem;
		}
		
		.airport-header {
			gap: 0.75rem;
			margin-bottom: 1rem;
		}
		
		.airport-icon {
			width: 40px;
			height: 40px;
		}
		
		.airport-icon svg {
			width: 20px;
			height: 20px;
		}
		
		.airport-details h4 {
			font-size: 1.1rem;
		}
		
		.route-stats {
			grid-template-columns: 1fr;
			gap: 0.75rem;
			margin-bottom: 1rem;
		}
		
		.stat {
			padding: 0.75rem;
		}
		
		.stat-icon {
			width: 28px;
			height: 28px;
		}
		
		.stat-icon svg {
			width: 16px;
			height: 16px;
		}
		
		.stat-value {
			font-size: 1rem;
		}
		
		.route-notice {
			padding: 0.5rem 0.75rem;
			font-size: 0.8rem;
		}
	}
</style>
