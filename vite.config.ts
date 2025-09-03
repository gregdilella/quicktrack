import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// Load environment variables
	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [tailwindcss(), sveltekit()],
		define: {
			// Make environment variables available to the client
			'import.meta.env.PUBLIC_SUPABASE_URL': JSON.stringify(env.PUBLIC_SUPABASE_URL),
			'import.meta.env.PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.PUBLIC_SUPABASE_ANON_KEY)
		},
		server: { fs: { allow: ['..'] } },
		ssr: {
			noExternal: ['bits-ui', 'lucide-svelte', '@internationalized/date'],
			external: ['@internationalized/date']
		},
		optimizeDeps: {
			include: ['bits-ui', 'lucide-svelte', '@internationalized/date'],
			exclude: ['@internationalized/date']
		}
	};
});
