<!-- About Page - No Auth Required -->
<script lang="ts">
	import { goto } from '$app/navigation'
</script>

<svelte:head>
	<title>About - CERTrack International Courier System</title>
	<meta name="description" content="Learn about CERTrack's international courier services and logistics solutions." />
</svelte:head>

<div class="landing-container">
	<header class="landing-header">
		<div class="header-content">
			<div class="logo-section">
				<img src="/ChatGPT Image Jul 14, 2025, 06_29_52 PM.png" alt="CERTrack Logo" class="header-logo"/>
				<h1 class="company-name">CERTrack</h1>
			</div>
			<nav class="header-nav">
				<a href="/" class="nav-link">Home</a>
				<a href="/about" class="nav-link active">About</a>
				<button on:click={() => goto('/')} class="signin-btn">Sign In</button>
			</nav>
		</div>
	</header>

	<main class="landing-main">
		<section class="hero-section">
			<div class="hero-content">
				<h2 class="hero-title">About CERTrack</h2>
				<p class="hero-subtitle">Your trusted partner in international logistics and courier services</p>
			</div>
		</section>

		<section class="content-section">
			<div class="content-container">
				<div class="about-grid">
					<div class="about-card">
						<h3 class="card-title">Our Mission</h3>
						<p class="card-text">
							To provide fast, reliable, and efficient international courier services that connect businesses and individuals across the globe. We are committed to delivering excellence in every shipment.
						</p>
					</div>

					<div class="about-card">
						<h3 class="card-title">Our Services</h3>
						<ul class="service-list">
							<li>International Express Delivery</li>
							<li>Ground Transportation</li>
							<li>Air Freight Services</li>
							<li>Ocean Freight Solutions</li>
							<li>Supply Chain Management</li>
							<li>Customs Clearance</li>
						</ul>
					</div>

					<div class="about-card">
						<h3 class="card-title">Why Choose Us</h3>
						<ul class="feature-list">
							<li>24/7 Customer Support</li>
							<li>Real-time Tracking</li>
							<li>Global Network Coverage</li>
							<li>Competitive Pricing</li>
							<li>Secure Packaging</li>
							<li>Insurance Options</li>
						</ul>
					</div>

					<div class="about-card">
						<h3 class="card-title">Contact Information</h3>
						<div class="contact-info">
							<p><strong>Email:</strong> info@certrack.com</p>
							<p><strong>Phone:</strong> +1 (555) 123-4567</p>
							<p><strong>Address:</strong> 123 Logistics Ave, Shipping City, SC 12345</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	</main>

	<footer class="landing-footer">
		<div class="footer-content">
			<p>&copy; 2024 CERTrack International Courier System. All rights reserved.</p>
			<div class="footer-links">
				<a href="/about" class="footer-link">About</a>
				<a href="/" class="footer-link">Sign In</a>
			</div>
		</div>
	</footer>
</div>

<style>
	.landing-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background-color: #ffffff;
	}

	/* Header */
	.landing-header {
		background-color: #dc2626;
		color: white;
		padding: 1rem 0;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.header-content {
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 2rem;
	}

	.logo-section {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.header-logo {
		width: 40px;
		height: 40px;
		opacity: 0.9;
	}

	.company-name {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
	}

	.header-nav {
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	.nav-link {
		color: white;
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		transition: background-color 0.2s ease;
	}

	.nav-link:hover,
	.nav-link.active {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.signin-btn {
		background-color: white;
		color: #dc2626;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.signin-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	/* Hero Section */
	.hero-section {
		background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
		color: white;
		padding: 4rem 2rem;
		text-align: center;
	}

	.hero-content {
		max-width: 800px;
		margin: 0 auto;
	}

	.hero-title {
		font-size: 3rem;
		font-weight: 700;
		margin: 0 0 1rem 0;
	}

	.hero-subtitle {
		font-size: 1.25rem;
		margin: 0;
		opacity: 0.9;
	}

	/* Content Section */
	.content-section {
		flex: 1;
		padding: 4rem 2rem;
		background-color: #f9fafb;
	}

	.content-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.about-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.about-card {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease;
	}

	.about-card:hover {
		transform: translateY(-2px);
	}

	.card-title {
		color: #dc2626;
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
	}

	.card-text {
		color: #6b7280;
		line-height: 1.6;
		margin: 0;
	}

	.service-list,
	.feature-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.service-list li,
	.feature-list li {
		color: #6b7280;
		padding: 0.5rem 0;
		border-bottom: 1px solid #e5e7eb;
		position: relative;
		padding-left: 1rem;
	}

	.service-list li:before,
	.feature-list li:before {
		content: "✓";
		color: #dc2626;
		font-weight: bold;
		position: absolute;
		left: 0;
	}

	.service-list li:last-child,
	.feature-list li:last-child {
		border-bottom: none;
	}

	.contact-info p {
		color: #6b7280;
		margin: 0.5rem 0;
	}

	.contact-info strong {
		color: #374151;
	}

	/* Footer */
	.landing-footer {
		background-color: #1f2937;
		color: white;
		padding: 2rem 0;
		text-align: center;
	}

	.footer-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.footer-links {
		display: flex;
		gap: 2rem;
	}

	.footer-link {
		color: #9ca3af;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.footer-link:hover {
		color: white;
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.header-content {
			flex-direction: column;
			gap: 1rem;
		}

		.hero-title {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1rem;
		}

		.about-grid {
			grid-template-columns: 1fr;
		}

		.footer-content {
			flex-direction: column;
			gap: 1rem;
		}

		.footer-links {
			gap: 1rem;
		}
	}
</style> 