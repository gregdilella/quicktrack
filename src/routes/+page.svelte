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
			<h1 class="main-title">Certus Freight</h1>
			<p class="subtitle">Fast, reliable, and secure courier services worldwide</p>
		</div>

		<!-- Call to Action -->
		<div class="cta-section">
			<button 
				class="signin-btn" 
				on:click={navigateToSignIn}
			>
				Get Started
			</button>
			<p class="cta-text">Join thousands of satisfied customers worldwide</p>
		</div>

		<!-- Features Grid -->
		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
					</svg>
				</div>
				<h3>Fast Delivery</h3>
				<p>Express shipping to 200+ countries</p>
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
			rgba(220, 38, 38, 0.4) 0%,
			rgba(220, 38, 38, 0.3) 50%,
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
		padding: 2rem;
		color: white;
	}

	/* Header Section */
	.header-section {
		margin-bottom: 3rem;
	}

	.main-title {
		font-size: 5rem;
		font-weight: 800;
		margin: 0 0 1rem 0;
		text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
		background: linear-gradient(45deg, #ffffff, #d1d5db);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		line-height: 1.2;
	}

	.subtitle {
		font-size: 1.5rem;
		margin: 0;
		opacity: 0.9;
		font-weight: 300;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
	}

	/* Call to Action */
	.cta-section {
		margin-bottom: 4rem;
	}

	.signin-btn {
		background: #dc2626;
		color: white;
		border: none;
		border-radius: 50px;
		padding: 1.25rem 3rem;
		font-size: 1.2rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		text-transform: uppercase;
		letter-spacing: 1px;
		box-shadow: 0 4px 20px rgba(220, 38, 38, 0.4);
		margin-bottom: 1rem;
		display: inline-block;
	}

	.signin-btn:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 30px rgba(220, 38, 38, 0.6);
		background: #b91c1c;
	}

	.signin-btn:active {
		transform: translateY(-1px);
	}

	.cta-text {
		font-size: 1rem;
		opacity: 0.8;
		margin: 0;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
	}

	/* Features Grid */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		max-width: 900px;
		width: 100%;
	}

	.feature-card {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 20px;
		padding: 2rem;
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
		}

		.main-title {
			font-size: 3rem;
		}

		.subtitle {
			font-size: 1.2rem;
		}

		.signin-btn {
			padding: 1rem 2rem;
			font-size: 1rem;
		}

		.features-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.feature-card {
			padding: 1.5rem;
		}

		.header-section {
			margin-bottom: 2rem;
		}

		.cta-section {
			margin-bottom: 2rem;
		}
	}

	@media (max-width: 480px) {
		.main-title {
			font-size: 2.5rem;
		}

		.subtitle {
			font-size: 1rem;
		}

		.feature-card {
			padding: 1rem;
		}
	}

	/* Global Styles */
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #000;
	}
</style>
