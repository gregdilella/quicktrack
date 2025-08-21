<!-- Landing Page -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let videoElement: HTMLVideoElement;
	let isVideoLoaded = false;

	onMount(() => {
		// Auto-play video when component mounts
		if (videoElement) {
			videoElement.play().catch(error => {
				console.log('Video autoplay failed:', error);
			});
		}
	});

	function handleVideoLoad() {
		isVideoLoaded = true;
	}

	function navigateToSignIn() {
		goto('/signin');
	}
</script>

<div class="landing-container">
	<!-- Video Background -->
	<div class="video-background">
		<video
			bind:this={videoElement}
			class="background-video"
			autoplay
			muted
			loop
			playsinline
			on:loadeddata={handleVideoLoad}
		>
			<source src="/5696874-hd_1920_1080_30fps.mp4" type="video/mp4">
			Your browser does not support the video tag.
		</video>
		
		<!-- Dark overlay for better text readability -->
		<div class="video-overlay"></div>
	</div>

	<!-- Content -->
	<div class="landing-content">
		<!-- Header -->
		<div class="header-section">
			<div class="logo-blur-container">
				<img src="/Certus Logo.png" alt="Certus Freight" class="main-logo" />
			</div>
		</div>

		<!-- Call to Action -->
		<div class="cta-section">
			<div class="glow-button-container">
				<div class="glow-effect"></div>
				<button 
					class="signin-btn" 
					on:click={navigateToSignIn}
				>
					Get Started
					<svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
					</svg>
				</button>
			</div>
			
			<div class="text-blur-container">
				<p class="subtitle">Fast, reliable, and secure courier services worldwide</p>
				<p class="cta-text">AI Powered Logistics Startup</p>
				<p class="cta-text">We Pass Savings On to You. Full GP Transparency</p>
			</div>
		</div>

		<!-- Features Grid -->
		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
					</svg>
				</div>
				<h3>Time Critical Shipments</h3>
				<p>Express shipping all over the world</p>
			</div>
			
			<div class="feature-card">
				<div class="feature-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
					</svg>
				</div>
				<h3>Secure Tracking</h3>
				<p>Real-time package monitoring</p>
			</div>
			
			<div class="feature-card">
				<div class="feature-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
					</svg>
				</div>
				<h3>24/7 Support</h3>
				<p>Expert customer service</p>
			</div>
		</div>
	</div>

	<!-- Loading indicator while video loads -->
	{#if !isVideoLoaded}
		<div class="loading-indicator">
			<div class="spinner"></div>
			<p>Loading...</p>
		</div>
	{/if}
</div>

<style>
	.landing-container {
		position: relative;
		width: 100%;
		height: 100vh;
		overflow: hidden;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Video Background */
	.video-background {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	.background-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.video-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			135deg,
			rgba(52, 84, 122, 0.4) 0%,
			rgba(52, 84, 122, 0.3) 50%,
			rgba(0, 0, 0, 0.3) 100%
		);
		z-index: 2;
	}

	/* Content */
	.landing-content {
		position: relative;
		z-index: 3;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		text-align: center;
		padding: 1.5rem;
		color: white;
		box-sizing: border-box;
	}

	/* Header Section */
	.header-section {
		margin-bottom: 1.5rem;
	}

	.logo-blur-container {
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 16px;
		padding: 0.75rem;
		margin: 0 auto;
		max-width: fit-content;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		transition: all 0.3s ease;
	}

	.logo-blur-container:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.25);
		transform: translateY(-2px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
	}

	.main-logo {
		max-width: 220px;
		width: 100%;
		height: auto;
		margin: 0;
		display: block;
		transition: all 0.3s ease;
	}

	.text-blur-container {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(15px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		padding: 1.25rem;
		margin: 0 auto;
		max-width: 600px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.subtitle {
		font-size: 1.5rem;
		margin: 0 0 1.5rem 0;
		opacity: 0.95;
		font-weight: 400;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
		line-height: 1.4;
	}

	/* Call to Action */
	.cta-section {
		margin-bottom: 2rem;
	}

	.cta-text {
		font-size: 1.1rem;
		opacity: 0.9;
		margin: 0 0 0.5rem 0;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
		font-weight: 500;
		line-height: 1.4;
	}

	.cta-text:last-child {
		margin-bottom: 0;
	}

	.glow-button-container {
		position: relative;
		display: inline-block;
		margin-top: 0;
		margin-bottom: 1.5rem;
	}

	.glow-effect {
		position: absolute;
		top: -12px;
		left: -12px;
		right: -12px;
		bottom: -12px;
		border-radius: 62px;
		background: linear-gradient(45deg, #ffffff, #34547a, #5a7fb8, #ffffff, #34547a);
		background-size: 400% 400%;
		animation: glowShift 3s ease-in-out infinite;
		filter: blur(16px);
		opacity: 0.8;
		z-index: -1;
	}

	@keyframes glowShift {
		0%, 100% {
			background-position: 0% 50%;
		}
		25% {
			background-position: 100% 50%;
		}
		50% {
			background-position: 100% 100%;
		}
		75% {
			background-position: 0% 100%;
		}
	}

	.signin-btn {
		background: rgba(255, 255, 255, 0.08);
		backdrop-filter: blur(20px);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 50px;
		padding: 1.25rem 3rem;
		font-size: 1.2rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 1px;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		position: relative;
		z-index: 10;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.signin-btn:hover {
		transform: translateY(-3px);
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.25);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
	}

	.signin-btn:active {
		transform: translateY(-1px);
	}

	.arrow-icon {
		width: 18px;
		height: 18px;
		transition: transform 0.3s ease;
	}

	.signin-btn:hover .arrow-icon {
		transform: translateX(3px);
	}

	/* Features Grid */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
		max-width: 900px;
		width: 100%;
	}

	.feature-card {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 16px;
		padding: 1.5rem;
		transition: all 0.3s ease;
	}

	.feature-card:hover {
		transform: translateY(-5px);
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.feature-icon {
		display: flex;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.feature-icon svg {
		width: 48px;
		height: 48px;
		color: #fecaca;
	}

	.feature-card h3 {
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: white;
	}

	.feature-card p {
		font-size: 1rem;
		opacity: 0.8;
		margin: 0;
		line-height: 1.6;
	}

	/* Loading Indicator */
	.loading-indicator {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 10;
		text-align: center;
		color: white;
		background: rgba(0, 0, 0, 0.8);
		padding: 2rem;
		border-radius: 12px;
		backdrop-filter: blur(10px);
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-top: 4px solid #dc2626;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.landing-content {
			padding: 1rem;
			justify-content: flex-start;
			padding-top: 1.5rem;
			padding-bottom: 2rem;
			min-height: 100vh;
			height: auto;
		}

		.header-section {
			margin-bottom: 1rem;
			flex-shrink: 0;
		}

		.logo-blur-container {
			padding: 0.5rem;
		}

		.main-logo {
			max-width: 180px;
		}

		.cta-section {
			margin-bottom: 1rem;
			flex-shrink: 0;
		}

		.glow-button-container {
			margin-bottom: 1rem;
		}

		.text-blur-container {
			padding: 1.25rem;
			margin: 0 auto;
			max-width: 95%;
		}

		.subtitle {
			font-size: 1.1rem;
			margin-bottom: 1rem;
		}

		.cta-text {
			font-size: 0.95rem;
			margin-bottom: 0.4rem;
		}

		.signin-btn {
			padding: 0.875rem 1.75rem;
			font-size: 0.95rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
			gap: 1rem;
			flex-shrink: 0;
			margin-bottom: 1rem;
		}

		.feature-card {
			padding: 1.25rem;
		}
	}

	@media (max-width: 480px) {
		.landing-content {
			padding: 0.75rem;
			padding-top: 1rem;
			padding-bottom: 2rem;
			height: auto;
			min-height: 100vh;
		}

		.header-section {
			margin-bottom: 0.75rem;
		}

		.logo-blur-container {
			padding: 0.4rem;
		}

		.main-logo {
			max-width: 140px;
		}

		.cta-section {
			margin-bottom: 0.75rem;
		}

		.glow-button-container {
			margin-bottom: 0.75rem;
		}

		.text-blur-container {
			padding: 1rem;
			margin: 0 auto;
			max-width: 98%;
		}

		.subtitle {
			font-size: 1rem;
			margin-bottom: 0.75rem;
		}

		.cta-text {
			font-size: 0.85rem;
			margin-bottom: 0.3rem;
		}

		.signin-btn {
			padding: 0.75rem 1.5rem;
			font-size: 0.9rem;
		}

		.features-grid {
			gap: 0.75rem;
			margin-bottom: 1rem;
		}

		.feature-card {
			padding: 1rem;
		}

		.feature-card h3 {
			font-size: 1.25rem;
			margin-bottom: 0.4rem;
		}

		.feature-card p {
			font-size: 0.9rem;
		}
	}

	/* Global Styles */
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #000;
	}
</style>
