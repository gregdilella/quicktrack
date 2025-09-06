<!-- LandingSection.svelte - Reusable section component with scroll animations -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	// Props
	export let title: string;
	export let reverse: boolean = false;
	export let id: string = '';
	export let imageSlot: Snippet | undefined = undefined;
	export let children: Snippet;
	export let singleColumn: boolean = false;

	// State for intersection observer
	let sectionElement: HTMLElement;
	let isVisible = false;

	// Set up intersection observer for continuous scroll animations
	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					// Continuous fade effect - fade in when intersecting, fade out when not
					isVisible = entry.isIntersecting;
				});
			},
			{
				threshold: 0.1, // Trigger when 10% of the element is visible
				rootMargin: '50px 0px' // Start animation 50px before element comes into view
			}
		);

		if (sectionElement) {
			observer.observe(sectionElement);
		}

		return () => {
			if (sectionElement) {
				observer.unobserve(sectionElement);
			}
		};
	});
</script>

<section 
	bind:this={sectionElement}
	{id}
	class="landing-section"
	class:visible={isVisible}
	class:reverse
>
	<div class="container">
		{#if singleColumn}
			<!-- Single Column Layout -->
			<div class="single-column-wrapper">
				{@render children()}
			</div>
		{:else}
			<!-- Two Column Layout -->
			<div class="content-wrapper" class:reverse>
				<!-- Text Content -->
				<div class="text-content">
					<h2 class="section-title">{title}</h2>
					<div class="section-text">
						{@render children()}
					</div>
				</div>

				<!-- Image/Visual Content -->
				<div class="image-content">
					{#if imageSlot}
						{@render imageSlot()}
					{/if}
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	.landing-section {
		padding: 4rem 0;
		background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
		border-bottom: 1px solid #e2e8f0;
		opacity: 0;
		transform: translateY(50px);
		transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.landing-section.visible {
		opacity: 1;
		transform: translateY(0);
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.content-wrapper {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4rem;
		align-items: center;
		min-height: 400px;
	}

	.content-wrapper.reverse {
		grid-template-columns: 1fr 1fr;
	}

	.content-wrapper.reverse .text-content {
		order: 2;
	}

	.content-wrapper.reverse .image-content {
		order: 1;
	}

	.single-column-wrapper {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
	}

	.text-content {
		animation: slideInLeft 0.8s ease-out 0.2s both;
	}

	.content-wrapper.reverse .text-content {
		animation: slideInRight 0.8s ease-out 0.2s both;
	}

	.image-content {
		animation: slideInRight 0.8s ease-out 0.4s both;
	}

	.content-wrapper.reverse .image-content {
		animation: slideInLeft 0.8s ease-out 0.4s both;
	}

	.section-title {
		font-size: 2.5rem;
		font-weight: 700;
		color: #34547a;
		margin: 0 0 1.5rem 0;
		line-height: 1.2;
		text-align: center;
	}

	.section-text {
		font-size: 1.125rem;
		line-height: 1.7;
		color: #475569;
	}

	.section-text :global(p) {
		margin: 0 0 1rem 0;
	}

	.section-text :global(p:last-child) {
		margin-bottom: 0;
	}

	.section-text :global(ul) {
		margin: 1rem 0;
		padding-left: 1.5rem;
	}

	.section-text :global(ol) {
		margin: 1rem 0;
		padding-left: 1.5rem;
	}

	.section-text :global(li) {
		margin: 0.5rem 0;
		line-height: 1.6;
	}

	.section-text :global(strong) {
		color: #34547a;
		font-weight: 600;
	}

	.section-text :global(a) {
		color: #34547a;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.section-text :global(a:hover) {
		color: #2c4766;
		text-decoration: underline;
	}

	.image-content {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* Animation keyframes */
	@keyframes slideInLeft {
		from {
			opacity: 0;
			transform: translateX(-50px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(50px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.landing-section {
			padding: 3rem 0;
		}

		.container {
			padding: 0 1rem;
		}

		.content-wrapper {
			grid-template-columns: 1fr;
			gap: 2rem;
			text-align: center;
		}

		.content-wrapper.reverse .text-content,
		.content-wrapper.reverse .image-content {
			order: unset;
		}

		.text-content,
		.content-wrapper.reverse .text-content,
		.image-content,
		.content-wrapper.reverse .image-content {
			animation: slideInUp 0.8s ease-out both;
		}

		.section-title {
			font-size: 2rem;
			margin-bottom: 1rem;
		}

		.section-text {
			font-size: 1rem;
		}
	}

	@keyframes slideInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
