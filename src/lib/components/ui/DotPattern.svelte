<script>
  import { cn } from "$lib/utils";
  
  // Props for customizing the dot pattern
  export let width = 16;
  export let height = 16;
  export let x = 0;
  export let y = 0;
  export let cx = 1;
  export let cy = 1;
  export let cr = 1;
  export let fillColor = "rgb(163 163 163 / 0.8)";

  // Class prop for additional styling
  let className = "";
  export { className as class };
  
  // Generate a unique ID for the pattern to avoid conflicts
  const id = `dot-pattern-${Math.random().toString(36).substr(2, 9)}`;
</script>

<!-- svelte-ignore a11y-unknown-aria-attribute -->
<svg
  aria-hidden="true"
  class={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
  fill={fillColor}
>
  <defs>
    <pattern
      id={id}
      width={width}
      height={height}
      patternUnits="userSpaceOnUse"
      patternContentUnits="userSpaceOnUse"
      x={x}
      y={y}
    >
      <circle cx={cx} cy={cy} r={cr} />
    </pattern>
  </defs>
  <rect width="100%" height="100%" stroke-width="0" fill={`url(#${id})`} />
</svg>