<!-- ScrollReveal.svelte - A component that reveals content as user scrolls -->
<script lang="ts">
	import { onMount } from 'svelte';
	
	// Props
	interface Props {
		children?: any;
		delay?: number; // Delay in milliseconds
		threshold?: number; // How much of the element should be visible before triggering
		once?: boolean; // Whether to animate only once
		direction?: 'up' | 'down' | 'left' | 'right' | 'scale'; // Animation direction
		duration?: number; // Animation duration in milliseconds
	}
	
	let {
		children,
		delay = 0,
		threshold = 0.1,
		once = true,
		direction = 'up',
		duration = 600
	}: Props = $props();
	
	let elementRef: HTMLElement;
	let isVisible = $state(false);
	let hasAnimated = $state(false);
	
	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						// Add delay before revealing
						setTimeout(() => {
							isVisible = true;
							if (once) {
								hasAnimated = true;
								observer.unobserve(elementRef);
							}
						}, delay);
					} else if (!once && !hasAnimated) {
						// Reset animation if once is false and we haven't permanently animated
						isVisible = false;
					}
				});
			},
			{
				threshold: threshold,
				rootMargin: '0px 0px -50px 0px' // Trigger slightly before element is fully visible
			}
		);
		
		if (elementRef) {
			observer.observe(elementRef);
		}
		
		return () => {
			if (elementRef) {
				observer.unobserve(elementRef);
			}
		};
	});
</script>

<div 
	bind:this={elementRef}
	class="scroll-reveal scroll-reveal--{direction}"
	class:scroll-reveal--visible={isVisible}
	style="--duration: {duration}ms; --delay: {delay}ms;"
>
	{@render children?.()}
</div>

<style>
	.scroll-reveal {
		transition: all var(--duration) cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	/* Direction: Up (default) */
	.scroll-reveal--up {
		opacity: 0;
		transform: translateY(40px);
	}
	
	.scroll-reveal--up.scroll-reveal--visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	/* Direction: Down */
	.scroll-reveal--down {
		opacity: 0;
		transform: translateY(-40px);
	}
	
	.scroll-reveal--down.scroll-reveal--visible {
		opacity: 1;
		transform: translateY(0);
	}
	
	/* Direction: Left */
	.scroll-reveal--left {
		opacity: 0;
		transform: translateX(-40px);
	}
	
	.scroll-reveal--left.scroll-reveal--visible {
		opacity: 1;
		transform: translateX(0);
	}
	
	/* Direction: Right */
	.scroll-reveal--right {
		opacity: 0;
		transform: translateX(40px);
	}
	
	.scroll-reveal--right.scroll-reveal--visible {
		opacity: 1;
		transform: translateX(0);
	}
	
	/* Direction: Scale (pop effect) */
	.scroll-reveal--scale {
		opacity: 0;
		transform: scale(0.8);
	}
	
	.scroll-reveal--scale.scroll-reveal--visible {
		opacity: 1;
		transform: scale(1);
	}
</style>
