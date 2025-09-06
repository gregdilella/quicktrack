<!-- Landing Page -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import LandingSection from '$lib/components/LandingSection.svelte';
	import ScrollReveal from '$lib/components/ScrollReveal.svelte';
	import DotPattern from '$lib/components/ui/DotPattern.svelte';

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
			onloadeddata={handleVideoLoad}
		>
			<source src="/5696874-hd_1920_1080_30fps.mp4" type="video/mp4">
			Your browser does not support the video tag.
		</video>
		
		<!-- Dark overlay for better text readability -->
		<div class="video-overlay"></div>
	</div>

	<!-- Full Page Dot Pattern Background -->
	<DotPattern 
		class="fixed inset-0 opacity-20 pointer-events-none"
		fillColor="rgb(255 255 255 / 0.3)"
		width={32}
		height={32}
		cr={2}
	/>
	
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
					onclick={navigateToSignIn}
				>
					Get Started
					<svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
					</svg>
				</button>
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

{#snippet servicesContent()}
	<!-- This will be empty since we're moving everything to the text side -->
{/snippet}

{#snippet servicesText()}
	<div class="services-full-layout">
		<!-- Dot Pattern Background -->
		<DotPattern 
			class="absolute inset-0 opacity-25 -z-10"
			fillColor="rgb(52 84 122 / 0.4)"
			width={24}
			height={24}
			cr={2}
		/>
		
		<!-- Header Section -->
		<ScrollReveal direction="up" delay={0} duration={800}>
			<div class="services-header">
				<h2 class="services-title">Our Services</h2>
				<p class="services-tagline">Comprehensive logistics solutions for time-critical shipments worldwide</p>
				<p class="services-subtitle">Our services are designed to meet the most demanding delivery requirements with precision and reliability.</p>
			</div>
		</ScrollReveal>
		
		<!-- First Row - 3 Services -->
		<div class="services-row-first">
			<ScrollReveal direction="scale" delay={100} duration={600}>
				<div class="service-card-new nfo">
					<div class="service-header">
						<div class="service-badge-new">NFO</div>
						<h3>Next Flight Out</h3>
					</div>
					<p>Speed and reliability at substantial cost savings. Get your time-critical shipment on the next flight out – to anywhere, from anywhere, any day of the week.</p>
					<div class="service-icon-new">✈️</div>
				</div>
			</ScrollReveal>
			
			<ScrollReveal direction="scale" delay={200} duration={600}>
				<div class="service-card-new obc">
					<div class="service-header">
						<div class="service-badge-new">OBC</div>
						<h3>On-Board Courier</h3>
					</div>
					<p>Professional hand carry service where experienced couriers accompany your urgent shipment to ensure it arrives fast and in pristine condition.</p>
					<div class="service-icon-new">👤</div>
				</div>
			</ScrollReveal>
			
			<ScrollReveal direction="scale" delay={300} duration={600}>
				<div class="service-card-new acf">
					<div class="service-header">
						<div class="service-badge-new">ACF</div>
						<h3>Air Charter Flight</h3>
					</div>
					<p>For special cases, our team can charter a private plane to fly your shipment point to point without any interruption or time wasted.</p>
					<div class="service-icon-new">🛩️</div>
				</div>
			</ScrollReveal>
		</div>
		
		<!-- Second Row - 2 Services (Centered) -->
		<div class="services-row-second">
			<ScrollReveal direction="scale" delay={400} duration={600}>
				<div class="service-card-new drive">
					<div class="service-header">
						<div class="service-badge-new">DD</div>
						<h3>Dedicated Drive</h3>
					</div>
					<p>Regional and domestic urgent deliveries with direct, secure transportation and real-time tracking.</p>
					<div class="service-icon-new">🚛</div>
				</div>
			</ScrollReveal>
			
			<ScrollReveal direction="scale" delay={500} duration={600}>
				<div class="service-card-new temp">
					<div class="service-header">
						<div class="service-badge-new">TC</div>
						<h3>Temperature Control</h3>
					</div>
					<p>Specialized transport for pharmaceuticals and biologics with continuous monitoring and compliance documentation.</p>
					<div class="service-icon-new">🌡️</div>
				</div>
			</ScrollReveal>
		</div>
	</div>
{/snippet}

<!-- Services Section -->
<LandingSection title="Our Services" id="services" singleColumn={true} children={servicesText} />

{#snippet missionContent()}
	<div class="mission-visual">
		<!-- Dot Pattern Background - Behind the entire mission visual -->
		<DotPattern 
			class="absolute inset-0 opacity-30 -z-10"
			fillColor="rgb(52 84 122 / 0.5)"
			width={24}
			height={24}
			cr={2}
		/>
		
		<!-- Mission content with login button -->
		<div class="mission-placeholder">
			<div class="mission-icon">
				<img src="/Certus Logo.png" alt="Certus Freight" class="mission-logo" />
			</div>
			<p>Delivering excellence through innovation and reliability</p>
			
			<!-- Login Button -->
			<div class="mission-login-container">
				<div class="glow-button-container">
					<div class="glow-effect"></div>
					<button 
						class="login-btn" 
						onclick={() => goto('/signin')}
					>
						Login
						<svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>
{/snippet}

{#snippet missionText()}
	<p><strong>Whatever the challenge, we deliver solutions.</strong></p>
	<p>We provide <strong>fast, reliable, and secure transport services worldwide</strong> — more than just an international courier, we are your trusted logistics partner.  Our team combines global expertise with advanced AI-driven tools to anticipate obstacles, optimize routes, and ensure every urgent shipment arrives on time.</p>
	<p>From customs delays to overbooked flights or the tightest deadlines, we leverage innovation and real-time data to overcome barriers that others cannot. <strong>We pass savings on to you with full GP transparency and minimum operational overhead</strong> — every step of the process is supported by clear communication and complete job-level pricing transparency, so you always know exactly what to expect.</p>
	<p>Where conventional couriers see restrictions, we see opportunities — delivering with precision, accountability, and technology at the core of our service.</p>
{/snippet}

<!-- Mission Section -->
<LandingSection title="Our Mission" reverse imageSlot={missionContent} children={missionText} />

<style>
	.landing-container {
		position: relative;
		width: 100%;
		height: 100vh;
		overflow: hidden;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	@media (max-width: 768px) {
		.landing-container {
			height: auto;
			min-height: 100vh;
			overflow: visible;
		}
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
		border-radius: 20px;
		padding: 1.5rem;
		margin: 0 auto;
		max-width: fit-content;
		box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
		transition: all 0.3s ease;
	}

	.logo-blur-container:hover {
		background: rgba(255, 255, 255, 0.12);
		border-color: rgba(255, 255, 255, 0.25);
		transform: translateY(-2px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
	}

	.main-logo {
		max-width: 350px;
		width: 100%;
		height: auto;
		margin: 0;
		display: block;
		transition: all 0.3s ease;
	}


	/* Call to Action */
	.cta-section {
		margin-bottom: 2rem;
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
			padding-bottom: 3rem;
			min-height: 100vh;
			height: auto;
			overflow-y: auto;
		}

		.header-section {
			margin-bottom: 1rem;
			flex-shrink: 0;
		}

		.logo-blur-container {
			padding: 1rem;
		}

		.main-logo {
			max-width: 280px;
		}

		.cta-section {
			margin-bottom: 1rem;
			flex-shrink: 0;
		}

		.glow-button-container {
			margin-bottom: 1rem;
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
			padding-bottom: 3rem;
			height: auto;
			min-height: 100vh;
			overflow-y: auto;
		}

		.header-section {
			margin-bottom: 0.75rem;
		}

		.logo-blur-container {
			padding: 0.75rem;
		}

		.main-logo {
			max-width: 220px;
		}

		.cta-section {
			margin-bottom: 0.75rem;
		}

		.glow-button-container {
			margin-bottom: 0.75rem;
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

	/* Services Full Layout Styles */
	:global(.services-full-layout) {
		width: 100%;
		position: relative;
		overflow: hidden;
	}

	:global(.services-header) {
		text-align: center;
		margin-bottom: 3rem;
	}

	:global(.services-title) {
		font-size: 2.5rem;
		font-weight: 700;
		color: #34547a;
		margin: 0 0 1.5rem 0;
		line-height: 1.2;
	}

	:global(.services-row-first) {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 2rem;
		margin-bottom: 2rem;
	}

	:global(.services-row-second) {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	:global(.service-card-new) {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border: 2px solid rgba(52, 84, 122, 0.1);
		border-radius: 20px;
		padding: 2rem;
		position: relative;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 8px 32px rgba(52, 84, 122, 0.1);
		overflow: hidden;
	}

	:global(.service-card-new::before) {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(135deg, #34547a, #5a7fb8);
		transition: all 0.3s ease;
	}

	:global(.service-card-new:hover) {
		transform: translateY(-8px);
		border-color: rgba(52, 84, 122, 0.2);
		box-shadow: 0 16px 48px rgba(52, 84, 122, 0.2);
	}

	:global(.service-card-new:hover::before) {
		height: 6px;
	}

	:global(.service-header) {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	:global(.service-badge-new) {
		background: linear-gradient(135deg, #34547a, #5a7fb8);
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 25px;
		font-weight: 700;
		font-size: 0.75rem;
		letter-spacing: 1px;
		box-shadow: 0 4px 12px rgba(52, 84, 122, 0.3);
		flex-shrink: 0;
	}

	:global(.service-card-new.nfo .service-badge-new) {
		background: linear-gradient(135deg, #1e40af, #3b82f6);
	}

	:global(.service-card-new.obc .service-badge-new) {
		background: linear-gradient(135deg, #dc2626, #ef4444);
	}

	:global(.service-card-new.acf .service-badge-new) {
		background: linear-gradient(135deg, #059669, #10b981);
	}

	:global(.service-card-new.drive .service-badge-new) {
		background: linear-gradient(135deg, #7c3aed, #8b5cf6);
	}

	:global(.service-card-new.temp .service-badge-new) {
		background: linear-gradient(135deg, #ea580c, #f97316);
	}

	:global(.service-card-new h3) {
		font-size: 1.25rem;
		font-weight: 600;
		color: #34547a;
		margin: 0;
		line-height: 1.3;
	}

	:global(.service-card-new p) {
		font-size: 0.95rem;
		line-height: 1.6;
		color: #64748b;
		margin: 0 0 1.5rem 0;
	}

	:global(.service-icon-new) {
		position: absolute;
		bottom: 1.5rem;
		right: 1.5rem;
		font-size: 2rem;
		opacity: 0.3;
		transition: all 0.3s ease;
	}

	:global(.service-card-new:hover .service-icon-new) {
		opacity: 0.6;
		transform: scale(1.1);
	}

	/* Services Intro Styles */
	:global(.services-intro) {
		text-align: center;
		margin-bottom: 2rem;
	}

	:global(.services-tagline) {
		font-size: 1.5rem;
		font-weight: 600;
		color: #34547a;
		margin: 0 0 1rem 0;
		line-height: 1.4;
	}

	:global(.services-subtitle) {
		font-size: 1.125rem;
		line-height: 1.6;
		color: #64748b;
		margin: 0;
	}

	/* Mission Visual Styles */
	:global(.mission-visual) {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
		height: 100%;
		position: relative;
		overflow: hidden;
	}

	:global(.mission-placeholder) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		text-align: center;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		padding: 2rem 1.5rem;
		border-radius: 16px;
		border: 2px solid #e2e8f0;
		box-shadow: 0 4px 12px rgba(52, 84, 122, 0.08);
		position: relative;
	}

	:global(.mission-icon) {
		width: clamp(200px, 25vw, 320px);
		height: clamp(200px, 25vw, 320px);
		color: #34547a;
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 1rem;
	}

	:global(.mission-icon svg) {
		width: 100%;
		height: 100%;
	}

	:global(.mission-logo) {
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0 4px 8px rgba(52, 84, 122, 0.1));
	}

	:global(.mission-placeholder p) {
		font-size: 1.125rem;
		font-weight: 500;
		color: #64748b;
		margin: 0 0 2rem 0;
		line-height: 1.5;
	}

	:global(.mission-login-container) {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	:global(.mission-login-container .glow-button-container) {
		position: relative;
		display: inline-block;
	}

	/* Responsive adjustments for new sections */
	@media (max-width: 768px) {
		:global(.services-row-first) {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		:global(.services-row-second) {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		:global(.service-card-new) {
			padding: 1.5rem;
		}

		:global(.services-title) {
			font-size: 2rem;
		}

		:global(.services-tagline) {
			font-size: 1.25rem;
		}

		:global(.services-subtitle) {
			font-size: 1rem;
		}

		:global(.mission-placeholder) {
			padding: 2rem 1.5rem;
		}

		:global(.mission-icon) {
			width: clamp(180px, 22vw, 240px); /* Larger for tablet */
			height: clamp(180px, 22vw, 240px);
		}

		:global(.mission-placeholder p) {
			font-size: 1rem;
		}
		
		/* Ensure proper mobile stacking order for mission section */
		:global(.landing-section .content-wrapper.reverse) {
			display: flex;
			flex-direction: column;
		}
		
		:global(.landing-section .content-wrapper.reverse .text-content) {
			order: 1;
		}
		
		:global(.landing-section .content-wrapper.reverse .image-content) {
			order: 2;
		}
	}

	@media (max-width: 480px) {
		:global(.mission-icon) {
			width: clamp(140px, 20vw, 180px); /* Larger for mobile */
			height: clamp(140px, 20vw, 180px);
		}
		
		:global(.mission-placeholder) {
			padding: 1.5rem 1rem;
			gap: 1rem;
		}
		
		/* Ensure proper mobile stacking order for mission section on small screens */
		:global(.landing-section .content-wrapper.reverse) {
			display: flex;
			flex-direction: column;
		}
		
		:global(.landing-section .content-wrapper.reverse .text-content) {
			order: 1;
		}
		
		:global(.landing-section .content-wrapper.reverse .image-content) {
			order: 2;
		}
	}

	/* Login Button Styles (now in mission section) - matching Get Started button */
	:global(.mission-login-container .glow-effect) {
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
		z-index: 1;
	}

	:global(.mission-placeholder .login-btn) {
		background: rgba(52, 84, 122, 0.9);
		backdrop-filter: blur(20px);
		color: white !important;
		border: 1px solid rgba(255, 255, 255, 0.3);
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
		box-shadow: 0 8px 32px rgba(52, 84, 122, 0.4);
	}

	:global(.mission-placeholder .login-btn:hover) {
		transform: translateY(-3px);
		background: rgba(52, 84, 122, 1);
		border-color: rgba(255, 255, 255, 0.5);
		box-shadow: 0 12px 40px rgba(52, 84, 122, 0.6);
	}

	:global(.mission-placeholder .login-btn:active) {
		transform: translateY(-1px);
	}

	:global(.mission-placeholder .login-btn .arrow-icon) {
		width: 18px;
		height: 18px;
		transition: transform 0.3s ease;
		color: white;
	}

	:global(.mission-placeholder .login-btn:hover .arrow-icon) {
		transform: translateX(3px);
	}

	/* Ensure the glow animation keyframes are available */
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

	/* Snap Scroll Container */
	:global(html) {
		scroll-snap-type: y mandatory;
		scroll-behavior: smooth;
	}

	/* Make each main section snap */
	.landing-container,
	:global(.landing-section) {
		scroll-snap-align: start;
		scroll-snap-stop: always;
	}

	/* Ensure sections take full viewport height */
	:global(.landing-section) {
		min-height: 100vh;
		display: flex;
		align-items: center;
	}

	/* Global Styles */
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #f8fafc;
		overflow-x: hidden;
		position: relative;
	}

	/* Ensure proper z-index stacking */
	.landing-container {
		position: relative;
		z-index: 1;
	}

	:global(.landing-section) {
		position: relative;
		z-index: 1;
	}

	/* Full page dot pattern styling */
	:global(.fixed.inset-0.opacity-20) {
		z-index: 2;
	}
</style>
